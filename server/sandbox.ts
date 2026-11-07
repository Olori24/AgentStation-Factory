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

export interface SandboxExecutionResult {
  sandboxId: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  isolatedPath: string;
  runtime: 'docker' | 'local';
}

const BASE_SANDBOX_DIR = path.join(process.cwd(), 'data', 'sandboxes');

/**
 * Resolve the active sandbox runtime.
 *
 * - Production always defaults to the hardened Docker runtime (fail-closed).
 * - Development defaults to the local process runtime so the platform runs
 *   end-to-end without requiring a container engine.
 *
 * An explicit SANDBOX_RUNTIME always wins.
 */
export function getSandboxRuntime(): 'docker' | 'local' {
  const configured = (process.env.SANDBOX_RUNTIME || '').trim().toLowerCase();
  if (configured === 'docker' || configured === 'local') return configured;
  return process.env.NODE_ENV === 'production' ? 'docker' : 'local';
}

/**
 * Whether sandbox / terminal execution is permitted in this environment.
 *
 * An explicit TERMINAL_EXECUTION_ENABLED always wins. Otherwise execution is
 * enabled for the local development runtime and stays disabled in production
 * until the isolated runtime is explicitly certified.
 */
export function isSandboxExecutionEnabled(): boolean {
  const flag = (process.env.TERMINAL_EXECUTION_ENABLED || '').trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production' && getSandboxRuntime() === 'local';
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
  if (runtime !== 'docker' && runtime !== 'local') {
    throw new Error('Unsupported sandbox runtime. Production requires SANDBOX_RUNTIME=docker.');
  }
  if (!command || command.length > 20000) throw new Error('Command is missing or too large');
  if (runtime === 'local') assertLocalCommandSafe(command);
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
