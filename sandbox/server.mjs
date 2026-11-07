#!/usr/bin/env node
/**
 * AgentStation dedicated sandbox service.
 *
 * Runs inside the `sandbox` container started by the Docker Compose dev
 * profile. It accepts command-execution requests from the app over the
 * internal compose network and runs each one in a *throwaway, hardened
 * container* rather than on the service's own host:
 *
 *   docker run --rm --network=none --read-only --cap-drop=ALL \
 *     --security-opt=no-new-privileges --pids-limit=128 --memory=512m \
 *     --cpus=1 --ipc=none --ulimit nofile=256:256 --user 65532:65532 \
 *     -v <run-dir>:/workspace:rw -w /workspace <image> sh -lc "<command>"
 *
 * Security posture
 * - Never executes the client's command as a shell string on the host.
 * - Only reachable on the compose network; requires a shared token.
 * - Per-container limits: no network, read-only rootfs, no capabilities,
 *   non-root user, PID/memory/CPU/file-descriptor caps.
 * - Per-run directory is created, used as a bind mount, then deleted.
 * - Output is capped and every container is force-removed after the timeout.
 *
 * Endpoints
 *   GET  /health   -> { status, docker, image, active }
 *   POST /execute  -> { sandboxId, exitCode, stdout, stderr, durationMs, timedOut }
 *
 * Env
 *   SANDBOX_PORT          (default 7070)
 *   SANDBOX_IMAGE         (default agentstation-sandbox:latest)
 *   SANDBOX_REMOTE_TOKEN  shared secret; REQUIRED. The service refuses to start
 *                         without it, so authentication can never silently
 *                         become optional.
 *   SANDBOX_MAX_CONCURRENCY (default 4)
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import process from 'node:process';

const PORT = Number(process.env.SANDBOX_PORT || 7070);
const IMAGE = (process.env.SANDBOX_IMAGE || 'agentstation-sandbox:latest').trim();
const TOKEN = (process.env.SANDBOX_REMOTE_TOKEN || '').trim();
const MAX_CONCURRENCY = Number(process.env.SANDBOX_MAX_CONCURRENCY || 4);

// Fail closed: this service executes arbitrary commands in containers, so it
// must never run unauthenticated. Refuse to start without a shared secret.
if (!TOKEN) {
  console.error(
    '[sandbox] FATAL: SANDBOX_REMOTE_TOKEN is required. Refusing to start an ' +
      'unauthenticated command-execution service. Set it to a strong random ' +
      'value shared with the app (see .env.compose.example).'
  );
  process.exit(1);
}
if (TOKEN.length < 16) {
  console.error('[sandbox] FATAL: SANDBOX_REMOTE_TOKEN must be at least 16 characters.');
  process.exit(1);
}
const BUILD_CONTEXT = (process.env.SANDBOX_BUILD_CONTEXT || '').trim();
// Per-run workspaces. When this service is reached through the mounted Docker
// socket, the daemon resolves bind-mount sources on the HOST — so this path
// must exist identically on the host and inside this container (compose mounts
// it at the same absolute path). That is why it is configurable.
const RUN_ROOT = (process.env.SANDBOX_RUN_ROOT || path.join(os.tmpdir(), 'agentstation-runs')).trim();
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 120000;

fs.mkdirSync(RUN_ROOT, { recursive: true });

let active = 0;

function log(...args) {
  console.log(`[sandbox] ${new Date().toISOString()}`, ...args);
}

function dockerAvailable() {
  return new Promise((resolve) => {
    execFile('docker', ['--version'], { timeout: 10000 }, (err) => resolve(!err));
  });
}

function imagePresent() {
  return new Promise((resolve) => {
    execFile('docker', ['image', 'inspect', IMAGE], { timeout: 15000 }, (err) => resolve(!err));
  });
}

/**
 * Make sure the hardened execution image exists on the host engine.
 * If the compose profile mounted the sandbox build context, build it on first
 * start so `docker compose up --build` is genuinely one command.
 */
async function ensureImage() {
  if (await imagePresent()) return true;
  if (!BUILD_CONTEXT || !fs.existsSync(path.join(BUILD_CONTEXT, 'Dockerfile'))) {
    log(`image ${IMAGE} missing and no build context available`);
    return false;
  }
  log(`building ${IMAGE} from ${BUILD_CONTEXT} (first start)`);
  return new Promise((resolve) => {
    const child = spawn('docker', ['build', '-t', IMAGE, BUILD_CONTEXT], { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (err) => {
      log(`image build failed: ${err.message}`);
      resolve(false);
    });
    child.on('close', (code) => {
      log(code === 0 ? `image ${IMAGE} built` : `image build exited with ${code}`);
      resolve(code === 0);
    });
  });
}

function readBody(req, limit = 32 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/** Write the mission's files into the per-run directory, refusing path escapes. */
function materializeFiles(runDir, files) {
  if (!Array.isArray(files)) return;
  for (const file of files.slice(0, 200)) {
    const rel = String(file?.path || '').trim();
    const content = typeof file?.content === 'string' ? file.content : '';
    if (!rel || rel.length > 300) continue;
    if (rel.startsWith('/') || rel.includes('\0')) {
      throw new Error('Sandbox file path escapes sandbox');
    }
    const absolute = path.resolve(runDir, rel);
    const relative = path.relative(runDir, absolute);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Sandbox file path escapes sandbox');
    }
    const parentDir = path.dirname(absolute);
    fs.mkdirSync(parentDir, { recursive: true });
    // Symlink defence: resolve the parent directory (following any pre-existing
    // links) and refuse to write if the real location sits outside the run dir.
    // Also refuse when the target itself is already a symlink, so a file entry
    // can never be used to write through a link to a host path.
    const runRootReal = fs.realpathSync(runDir);
    const parentReal = fs.realpathSync(parentDir);
    const parentRelative = path.relative(runRootReal, parentReal);
    if (parentRelative.startsWith('..') || path.isAbsolute(parentRelative)) {
      throw new Error('Sandbox file path escapes sandbox');
    }
    try {
      if (fs.lstatSync(absolute).isSymbolicLink()) {
        throw new Error('Sandbox file path escapes sandbox');
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    fs.writeFileSync(absolute, content, 'utf8');
  }
}

function runContainer({ command, runDir, timeoutMs }) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const containerName = `agentstation-sbx-${crypto.randomBytes(6).toString('hex')}`;

    const args = [
      'run', '--rm',
      '--name', containerName,
      '--network=none',
      '--read-only',
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=128m',
      '--cap-drop=ALL',
      '--security-opt=no-new-privileges',
      '--pids-limit=128',
      '--memory=512m',
      '--cpus=1',
      '--ipc=none',
      '--ulimit', 'nofile=256:256',
      '--user', '65532:65532',
      '-v', `${runDir}:/workspace:rw`,
      '-w', '/workspace',
      IMAGE,
      'sh', '-lc', command,
    ];

    const child = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin', HOME: '/tmp' },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const kill = () => {
      timedOut = true;
      child.kill('SIGKILL');
      // --rm does not cover the SIGKILL'd client dropping the connection in all
      // cases, so force-remove by name to guarantee cleanup.
      execFile('docker', ['rm', '-f', containerName], { timeout: 15000 }, () => {});
    };

    const timer = setTimeout(kill, timeoutMs);

    const collect = (field) => (chunk) => {
      const text = chunk.toString();
      if (Buffer.byteLength(field === 'out' ? stdout : stderr, 'utf8') + Buffer.byteLength(text, 'utf8') > MAX_OUTPUT_BYTES) {
        kill();
        return;
      }
      if (field === 'out') stdout += text;
      else stderr += text;
    };

    child.stdout.on('data', collect('out'));
    child.stderr.on('data', collect('err'));

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}Sandbox container failed to start: ${err.message}`,
        durationMs: Date.now() - startedAt,
        timedOut: false,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? (timedOut ? 124 : 1),
        stdout,
        stderr: timedOut ? `${stderr}\n[SANDBOX TIMEOUT] Command exceeded ${timeoutMs / 1000}s execution limit. Container removed.` : stderr,
        durationMs: Date.now() - startedAt,
        timedOut,
      });
    });
  });
}

async function handleExecute(req, res) {
  let runDir = '';
  let reserved = false;
  try {
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }

    const command = typeof body.command === 'string' ? body.command.trim() : '';
    if (!command) return sendJson(res, 400, { error: 'command is required' });
    if (command.length > 20000) return sendJson(res, 400, { error: 'command is too large' });

    if (active >= MAX_CONCURRENCY) {
      return sendJson(res, 429, { error: `sandbox service is at capacity (${MAX_CONCURRENCY})` });
    }
    // Reserve the slot immediately after the capacity check and BEFORE the first
    // await, so concurrent requests can never both pass the check and
    // oversubscribe the host.
    active += 1;
    reserved = true;

    if (!(await ensureImage())) {
      return sendJson(res, 503, {
        error: `sandbox image ${IMAGE} is unavailable. Build it with: docker compose build`,
      });
    }

    const requested = Number(body.timeoutMs || 30000);
    const timeoutMs = Math.min(
      Math.max(Number.isFinite(requested) ? requested : 30000, MIN_TIMEOUT_MS),
      MAX_TIMEOUT_MS
    );

    const sandboxId = `sbx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    runDir = path.join(RUN_ROOT, sandboxId);
    fs.mkdirSync(runDir, { recursive: true });
    // The execution container runs as uid/gid 65532 (non-root). The run
    // directory is created by this service (root) with a restrictive umask, so
    // without this the container user cannot write to its own workspace.
    try {
      fs.chmodSync(runDir, 0o777);
    } catch (err) {
      log(`warning: could not chmod run dir ${runDir}: ${err?.message}`);
    }

    materializeFiles(runDir, body.files);

    log(`run ${sandboxId} start (active=${active})`);
    const result = await runContainer({ command, runDir, timeoutMs });

    sendJson(res, 200, { sandboxId, ...result, runtime: 'remote', isolatedPath: runDir });
    log(`run ${sandboxId} exit=${result.exitCode} ${result.durationMs}ms timedOut=${result.timedOut}`);
  } catch (err) {
    sendJson(res, 500, { error: err?.message || 'sandbox execution failed' });
  } finally {
    // Only release the slot if this request actually reserved one (the early
    // 400/429/503 returns happen before `active += 1`).
    if (reserved) active = Math.max(0, active - 1);
    if (runDir) {
      fs.rm(runDir, { recursive: true, force: true }, () => {});
    }
  }
}

// Probe results are cached briefly so container healthchecks do not spawn a
// `docker` process every few seconds.
let probeCache = { at: 0, docker: false, image: false };
async function probe(force = false) {
  if (!force && Date.now() - probeCache.at < 5000) return probeCache;
  const docker = await dockerAvailable();
  const image = docker ? await imagePresent() : false;
  probeCache = { at: Date.now(), docker, image };
  return probeCache;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
    const state = await probe();
    // Fail closed: a sandbox service that cannot reach the engine (or has no
    // execution image) reports 503 so `depends_on: service_healthy` blocks the
    // app instead of silently downgrading isolation.
    const ready = state.docker && state.image;
    return sendJson(res, ready ? 200 : 503, {
      status: ready ? 'ok' : 'degraded',
      service: 'agentstation-sandbox',
      docker: state.docker,
      image: IMAGE,
      imagePresent: state.image,
      active,
      maxConcurrency: MAX_CONCURRENCY,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === 'POST' && url.pathname === '/execute') {
    // Authentication is mandatory (the service refuses to start without a
    // token). Constant-time compare to avoid leaking the token via timing.
    const presented = String(req.headers['x-sandbox-token'] || '').trim();
    const a = Buffer.from(presented);
    const b = Buffer.from(TOKEN);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) return sendJson(res, 401, { error: 'unauthorized' });
    return handleExecute(req, res);
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', async () => {
  const hasDocker = await dockerAvailable();
  log(`listening on 0.0.0.0:${PORT} (image=${IMAGE}, auth=enabled)`);
  log(hasDocker ? 'docker engine reachable' : 'WARNING: docker engine not reachable from this service');
  if (!hasDocker) return;
  const ready = await ensureImage();
  log(ready ? `sandbox image ${IMAGE} is ready` : `WARNING: sandbox image ${IMAGE} not available`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    log(`received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  });
}
