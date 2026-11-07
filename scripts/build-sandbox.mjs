#!/usr/bin/env node
/**
 * Build the hardened AgentStation sandbox image used by SANDBOX_RUNTIME=docker.
 *
 *   npm run sandbox:build
 *
 * Requires a working Docker engine. The local development runtime
 * (SANDBOX_RUNTIME=local) does not need this image.
 */
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const image = (process.env.SANDBOX_IMAGE || 'agentstation-sandbox:latest').trim();

try {
  execFileSync('docker', ['--version'], { stdio: 'ignore' });
} catch {
  console.error('Docker is not available on this machine.');
  console.error('The local development runtime (SANDBOX_RUNTIME=local) works without it.');
  process.exit(1);
}

console.log(`Building sandbox image: ${image}`);
execFileSync('docker', ['build', '-t', image, 'sandbox'], { stdio: 'inherit' });
console.log(`\nSandbox image ready: ${image}`);
console.log('Set SANDBOX_RUNTIME=docker to use it.');
