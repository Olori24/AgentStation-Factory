import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { streaming } from './streaming';
import { db } from './db';

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  missionId?: string;
  env?: Record<string, string>;
  cwd?: string;
  files?: Array<{ path: string; content: string }>;
  onChunk?: (text: string, stream: 'stdout' | 'stderr') => void;
}

export type SandboxRuntime = 'docker' | 'local' | 'remote';

export interface SandboxExecutionResult {
  sandboxId: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  isolatedPath: string;
  runtime: SandboxRuntime;
}

const BASE_SANDBOX_DIR = path.join(process.cwd(), 'data', 'sandboxes');

/**
 * Resolve the active sandbox runtime.
 *
 * - Production always defaults to the hardened Docker runtime (fail-closed).
 * - Development defaults to the local process runtime so the platform runs
 *   end-to-end without requiring a container engine.
 * - `remote` dispatches to the dedicated sandbox service started by the
 *   Docker Compose dev profile (`docker compose up --build`): the
 *   commands run inside a throwaway, hardened container instead of on the app
 *   host. No Docker socket and no container engine are needed on the app host.
 *
 * An explicit SANDBOX_RUNTIME always wins.
 */
export function getSandboxRuntime(): SandboxRuntime {
  const configured = (process.env.SANDBOX_RUNTIME || '').trim().toLowerCase();
  if (configured === 'docker' || configured === 'local' || configured === 'remote') return configured;
  return process.env.NODE_ENV === 'production' ? 'docker' : 'local';
}

/** Base URL of the dedicated sandbox service used by the `remote` runtime. */
export function getRemoteSandboxUrl(): string {
  return (process.env.SANDBOX_REMOTE_URL || '').trim().replace(/\/$/, '');
}

/** Shared secret authenticating the app to the dedicated sandbox service. */
function getRemoteSandboxToken(): string {
  return (process.env.SANDBOX_REMOTE_TOKEN || '').trim();
}

/**
 * Whether sandbox / terminal execution is permitted in this environment.
 *
 * An explicit TERMINAL_EXECUTION_ENABLED always wins. Otherwise execution is
 * enabled for the local development runtime and for the containerized
 * `remote` runtime, and stays disabled in production until the isolated
 * runtime is explicitly certified.
 */
export function isSandboxExecutionEnabled(): boolean {
  const flag = (process.env.TERMINAL_EXECUTION_ENABLED || '').trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  const runtime = getSandboxRuntime();
  if (runtime === 'remote') return true;
  return process.env.NODE_ENV !== 'production' && runtime === 'local';
}

// High-risk host patterns refused by the local (non-container) runtime.
// The Docker runtime relies on kernel isolation instead of this denylist.
const LOCAL_DENY_PATTERNS: RegExp[] = [
  /\brm\s+-rf\s+\/(?:\s|$)/i,
  /\bmkfs(\.\w+)?\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /:\(\)\s*\{\s*:\|:&\s*\};:/,
  />\s*\/etc\//i,
];

function assertLocalCommandSafe(command: string) {
  for (const pattern of LOCAL_DENY_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error('Command refused by local sandbox safety policy.');
    }
  }
}

/**
 * Stream a spawned child process to completion, enforcing timeout and output
 * caps and forwarding live output to the mission stream. Shared by both the
 * Docker and local runtimes.
 */
function runChildProcess(
  child: import('child_process').ChildProcess,
  ctx: {
    sandboxId: string;
    command: string;
    sandboxPath: string;
    runtime: 'docker' | 'local';
    timeoutMs: number;
    startTime: number;
    missionId?: string;
    onChunk?: (text: string, stream: 'stdout' | 'stderr') => void;
  }
): Promise<SandboxExecutionResult> {
  const { sandboxId, command, sandboxPath, runtime, timeoutMs, startTime, missionId, onChunk } = ctx;

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      const timeoutMsg = `\n[SANDBOX TIMEOUT] Command exceeded ${timeoutMs / 1000}s execution limit. Killed.`;
      stderr += timeoutMsg;
      onChunk?.(timeoutMsg, 'stderr');
      if (missionId) {
        streaming.streamTerminalLine(missionId, timeoutMsg, 'stderr');
      }
    }, timeoutMs);

    const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      if (Buffer.byteLength(stdout, 'utf8') + Buffer.byteLength(text, 'utf8') > MAX_OUTPUT_BYTES) {
        timedOut = true;
        child.kill('SIGKILL');
        stderr += '\n[SANDBOX OUTPUT LIMIT] stdout exceeded 2MB.';
        return;
      }
      stdout += text;
      onChunk?.(text, 'stdout');
      if (missionId) {
        streaming.streamTerminalLine(missionId, text, 'stdout');
      }
    });

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      if (Buffer.byteLength(stderr, 'utf8') + Buffer.byteLength(text, 'utf8') > MAX_OUTPUT_BYTES) {
        timedOut = true;
        child.kill('SIGKILL');
        stderr += '\n[SANDBOX OUTPUT LIMIT] stderr exceeded 2MB.';
        return;
      }
      stderr += text;
      onChunk?.(text, 'stderr');
      if (missionId) {
        streaming.streamTerminalLine(missionId, text, 'stderr');
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      db.incrementMetric('totalSandboxExecutions');

      // Cleanup temporary sandbox dir after 5 minutes asynchronously
      setTimeout(() => {
        fs.promises.rm(sandboxPath, { recursive: true, force: true }).catch(() => {});
      }, 300000);

      resolve({
        sandboxId,
        command,
        exitCode: code ?? (timedOut ? 124 : 1),
        stdout,
        stderr,
        durationMs,
        timedOut,
        isolatedPath: sandboxPath,
        runtime,
      });
    });

    child.on('error', () => {
      clearTimeout(timer);
      resolve({
        sandboxId,
        command,
        exitCode: 1,
        stdout,
        stderr: 'Sandbox process failed to start.',
        durationMs: Date.now() - startTime,
        timedOut: false,
        isolatedPath: sandboxPath,
        runtime,
      });
    });
  });
}

/**
 * Execute a command through the dedicated sandbox service.
 *
 * This is the runtime behind the Docker Compose dev profile: the app container
 * never mounts a Docker socket and never runs untrusted code on its own host —
 * it hands the command to a separate service that executes it in a throwaway,
 * hardened container. Reachability plus the shared token is the trust boundary.
 */
async function executeRemoteSandbox(
  command: string,
  options: SandboxExecutionOptions,
  ctx: { sandboxId: string; timeoutMs: number; startTime: number }
): Promise<SandboxExecutionResult> {
  const { sandboxId, timeoutMs, startTime } = ctx;
  const baseUrl = getRemoteSandboxUrl();

  if (!baseUrl) {
    const message =
      'SANDBOX_RUNTIME=remote requires SANDBOX_REMOTE_URL (e.g. http://sandbox:7070). ' +
      'Start the containerized sandbox with: docker compose up --build';
    options.onChunk?.(`[SANDBOX] ${message}\n`, 'stderr');
    if (options.missionId) streaming.streamTerminalLine(options.missionId, message, 'stderr');
    return {
      sandboxId,
      command,
      exitCode: 1,
      stdout: '',
      stderr: message,
      durationMs: Date.now() - startTime,
      timedOut: false,
      isolatedPath: '',
      runtime: 'remote',
    };
  }

  const token = getRemoteSandboxToken();
  const payload = {
    command,
    timeoutMs,
    env: options.env || {},
    files: (options.files || []).map((file) => ({ path: file.path, content: file.content })),
  };

  try {
    const response = await fetch(`${baseUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Sandbox-Token': token } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs + 15000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`sandbox service returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 400)}` : ''}`);
    }

    const body: any = await response.json();
    const stdout = String(body?.stdout ?? '');
    const stderr = String(body?.stderr ?? '');

    // Replay the buffered output through the same chunk callback the local and
    // docker runtimes use, so the mission stream and terminal UI behave the same.
    if (stdout) options.onChunk?.(stdout, 'stdout');
    if (stderr) options.onChunk?.(stderr, 'stderr');

    db.incrementMetric('totalSandboxExecutions');

    return {
      sandboxId,
      command,
      exitCode: Number(body?.exitCode ?? 1),
      stdout,
      stderr,
      durationMs: Number(body?.durationMs ?? Date.now() - startTime),
      timedOut: Boolean(body?.timedOut),
      isolatedPath: String(body?.isolatedPath || ''),
      runtime: 'remote',
    };
  } catch (err: any) {
    const message = `Sandbox service unreachable at ${baseUrl}: ${err.message}`;
    options.onChunk?.(`${message}\n`, 'stderr');
    if (options.missionId) streaming.streamTerminalLine(options.missionId, message, 'stderr');
    return {
      sandboxId,
      command,
      exitCode: 1,
      stdout: '',
      stderr: message,
      durationMs: Date.now() - startTime,
      timedOut: false,
      isolatedPath: '',
      runtime: 'remote',
    };
  }
}

export async function executeSandboxedCommand(
  command: string,
  options: SandboxExecutionOptions = {}
): Promise<SandboxExecutionResult> {
  const sandboxId = `sbx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const sandboxPath = path.join(BASE_SANDBOX_DIR, sandboxId);
  const requestedTimeout = Number(options.timeoutMs || 30000);
  const timeoutMs = Math.min(Math.max(Number.isFinite(requestedTimeout) ? requestedTimeout : 30000, 1000), 120000);
  const runtime = getSandboxRuntime();

  if (process.env.NODE_ENV === 'production' && process.env.TERMINAL_EXECUTION_ENABLED !== 'true') {
    throw new Error('Production sandbox execution is disabled until the runtime is explicitly certified.');
  }
  if (process.env.NODE_ENV === 'production' && process.env.SANDBOX_RUNTIME !== 'docker') {
    throw new Error('Production sandbox requires SANDBOX_RUNTIME=docker. Host shell execution is permanently disabled.');
  }
  if (runtime !== 'docker' && runtime !== 'local' && runtime !== 'remote') {
    throw new Error('Unsupported sandbox runtime. Production requires SANDBOX_RUNTIME=docker.');
  }
  if (!command || command.length > 20000) throw new Error('Command is missing or too large');
  if (runtime === 'local') assertLocalCommandSafe(command);

  // Containerized dev profile: dispatch to the dedicated sandbox service. No
  // local directory is created and no host process is spawned here.
  if (runtime === 'remote') {
    if (options.missionId) {
      streaming.streamTerminalLine(options.missionId, `$ [SANDBOX CONTAINERIZED] ${command}\n`, 'stdout');
    }
    return executeRemoteSandbox(command, options, { sandboxId, timeoutMs, startTime: Date.now() });
  }

  const startTime = Date.now();

  try {
    await fs.promises.mkdir(sandboxPath, { recursive: true });

    // Mount workspace files if provided
    if (options.files && options.files.length > 0) {
      for (const file of options.files) {
        const fullFilePath = path.resolve(sandboxPath, file.path);
        const relativeFilePath = path.relative(sandboxPath, fullFilePath);
        if (!relativeFilePath || relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath)) throw new Error('Sandbox file path escapes sandbox');
        await fs.promises.mkdir(path.dirname(fullFilePath), { recursive: true });
        await fs.promises.writeFile(fullFilePath, file.content, 'utf8');
      }
    } else {
      // Default workspace symlink or copy
      const defaultWorkspace = path.join(process.cwd(), 'workspace');
      if (fs.existsSync(defaultWorkspace)) {
        // Copy files
        try {
          await fs.promises.cp(defaultWorkspace, sandboxPath, { recursive: true });
        } catch {}
      }
    }

    // Ensure tests directory is available in sandbox for unit testing suites
    const projectTests = path.join(process.cwd(), 'tests');
    const sandboxTests = path.join(sandboxPath, 'tests');
    if (fs.existsSync(projectTests) && !fs.existsSync(sandboxTests)) {
      try {
        await fs.promises.cp(projectTests, sandboxTests, { recursive: true });
      } catch {}
    }

    // Allowlist sandbox environment. Never inherit application secrets.
    const allowedEnvKeys = new Set(['PATH', 'NODE_ENV', 'CI', 'PYTHONUNBUFFERED', 'LANG', 'LC_ALL', 'TZ']);
    const scrubbedEnv: NodeJS.ProcessEnv = {};
    for (const key of allowedEnvKeys) {
      if (process.env[key]) scrubbedEnv[key] = process.env[key];
    }
    scrubbedEnv.NODE_ENV = 'test';
    scrubbedEnv.CI = 'true';
    scrubbedEnv.PYTHONUNBUFFERED = '1';
    for (const [key, value] of Object.entries(options.env || {})) {
      if (/^SANDBOX_[A-Z0-9_]+$/.test(key) && typeof value === 'string' && value.length <= 4096) {
        scrubbedEnv[key] = value;
      }
    }

    // Notify streaming
    if (options.missionId) {
      streaming.streamTerminalLine(options.missionId, `$ [SANDBOX ISOLATED] ${command}\n`, 'stdout');
    }

    const image = (process.env.SANDBOX_IMAGE || 'agentstation-sandbox:latest').trim();
    const dockerArgs = [
      'run', '--rm',
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
      '-v', sandboxPath + ':/workspace:rw',
      '-w', '/workspace',
      image,
      'sh', '-lc', command,
    ];

    const child = runtime === 'docker'
      ? spawn('docker', dockerArgs, {
          cwd: process.cwd(),
          env: {
            ...scrubbedEnv,
            DOCKER_CONFIG: '/nonexistent',
            HOME: '/tmp',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      : spawn('sh', ['-lc', command], {
          // Local development runtime: executes inside an isolated per-run
          // directory with a scrubbed environment. Production must use Docker.
          cwd: sandboxPath,
          env: {
            ...scrubbedEnv,
            HOME: '/tmp',
            TMPDIR: '/tmp',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });

    return await runChildProcess(child, {
      sandboxId,
      command,
      sandboxPath,
      runtime,
      timeoutMs,
      startTime,
      missionId: options.missionId,
      onChunk: options.onChunk,
    });
  } catch (err: any) {
    return {
      sandboxId,
      command,
      exitCode: 1,
      stdout: '',
      stderr: `Sandbox initialization failure: ${err.message}`,
      durationMs: Date.now() - startTime,
      timedOut: false,
      isolatedPath: sandboxPath,
      runtime,
    };
  }
}
