#!/usr/bin/env node
/**
 * AgentStation Factory — end-to-end demo.
 *
 * Boots the full-stack server (unless one is already listening), then drives a
 * complete autonomous mission through the public API:
 *
 *   signup -> plan -> execute -> poll -> deliverable summary
 *
 * Usage:
 *   npm run demo
 *   DEMO_BASE_URL=http://127.0.0.1:3000 npm run demo   # use a running server
 *   DEMO_KEEP_SERVER=1 npm run demo                    # leave the server up
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE = (process.env.DEMO_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const EMAIL = `demo-${Date.now()}@agentstation.dev`;
const PASSWORD = 'agentstation-demo-123';
const PROMPT =
  process.env.DEMO_PROMPT ||
  'Build a REST API for a task manager with SQLite persistence and a PyTest suite';

let cookie = '';
let serverProc = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(pathname, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + pathname, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function isUp() {
  try {
    const res = await fetch(BASE + '/api/health', { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await isUp()) {
    console.log(`• Using server already running at ${BASE}`);
    return;
  }
  console.log('• Starting AgentStation server (npm run dev)...');
  serverProc = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development', SANDBOX_RUNTIME: process.env.SANDBOX_RUNTIME || 'local' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProc.stdout.on('data', (d) => process.env.DEMO_VERBOSE && process.stdout.write(`  [server] ${d}`));
  serverProc.stderr.on('data', (d) => process.env.DEMO_VERBOSE && process.stderr.write(`  [server] ${d}`));

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (await isUp()) {
      console.log('• Server is up.');
      return;
    }
    await sleep(1000);
  }
  throw new Error('Server did not become healthy within 60s.');
}

function shutdown() {
  if (serverProc && !process.env.DEMO_KEEP_SERVER) {
    serverProc.kill('SIGTERM');
  }
}

async function main() {
  console.log('\n=== AgentStation Factory — end-to-end demo ===\n');
  await ensureServer();

  // 1. Authenticate (creates a fresh workspace + engineer account).
  const signup = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Demo Operator', email: EMAIL, password: PASSWORD },
  });
  if (!signup.json?.success) throw new Error(`Signup failed: ${JSON.stringify(signup.json)}`);
  console.log(`• Signed up as ${EMAIL} (role: ${signup.json.user.role})`);

  const missionId = `demo-${Date.now()}`;

  // 2. Plan the mission (Atlas decomposes the objective into subtasks).
  const plan = await api('/api/tasks/plan', { method: 'POST', body: { missionId, prompt: PROMPT } });
  if (!plan.json?.success) throw new Error(`Plan failed: ${JSON.stringify(plan.json)}`);
  const subtasks = plan.json.plan.subtasks;
  console.log(`• Planned ${subtasks.length} subtasks:`);
  for (const st of subtasks) console.log(`    ${st.order}. [${st.agentRole}] ${st.title}  (tool: ${st.toolName})`);

  // 3. Execute the mission (multi-agent loop: write -> test -> document -> bundle).
  const exec = await api('/api/tasks/execute', { method: 'POST', body: { missionId, prompt: PROMPT } });
  if (!exec.json?.success) throw new Error(`Execute failed: ${JSON.stringify(exec.json)}`);
  console.log('• Autonomous execution loop launched. Polling for completion...');

  // 4. Poll until the mission reaches a terminal state.
  let task = null;
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    const res = await api(`/api/tasks/${missionId}`);
    task = res.json?.task;
    if (task && (task.status === 'completed' || task.status === 'failed')) break;
    await sleep(1500);
  }
  if (!task) throw new Error('Mission did not return a task record.');
  if (task.status !== 'completed') throw new Error(`Mission ended with status: ${task.status}`);

  // 5. Summarize the deliverable.
  const files = task.files || [];
  const testExec = (task.execution && task.execution.stdout) || '';
  const passed = (testExec.match(/(\d+)\s+passed/i) || [])[1] || '0';

  console.log('\n=== Mission complete ===');
  console.log(`  Mission ID : ${missionId}`);
  console.log(`  Status     : ${task.status} (${task.progressPercent}%)`);
  console.log(`  Files      : ${files.length}`);
  for (const f of files) console.log(`      - ${f.path} (${f.language})`);
  console.log(`  Tests      : ${passed} passed`);
  console.log(`  Artifact   : ${task.artifact?.name || task.artifact?.downloadUrl || 'bundled'}`);

  // 6. Prove the sandbox actually executed code (not a stub).
  const sandbox = await api('/api/sandbox/execute', {
    method: 'POST',
    body: { missionId, files: [], command: 'python3 -c "print(6*7)" && echo sandbox-ok' },
  });
  if (sandbox.json?.success) {
    const out = (sandbox.json.execution.stdout || '').trim();
    console.log(`  Sandbox    : ${out.replace(/\n/g, ' | ')}`);
  } else {
    console.log(`  Sandbox    : ${sandbox.json?.error || 'unavailable'}`);
  }

  console.log('\nOpen the UI at ' + BASE + ' to explore the command deck.\n');
}

main()
  .then(() => {
    shutdown();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nDemo failed:', err.message);
    shutdown();
    process.exit(1);
  });
