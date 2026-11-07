"""Adversarial regression checks for the dedicated sandbox boundary.

These checks exercise fail-closed startup and inspect the concrete enforcement
points in the service/app source. They do not replace tests/test_docker_isolation.py,
which alone validates kernel/container isolation against a real Docker daemon.
"""
from pathlib import Path
import os
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_sandbox_service_refuses_missing_or_short_shared_secret():
    env = {**os.environ, "SANDBOX_REMOTE_TOKEN": ""}
    missing = subprocess.run(
        ["node", "sandbox/server.mjs"], cwd=ROOT, env=env,
        capture_output=True, text=True, timeout=5,
    )
    assert missing.returncode != 0
    assert "SANDBOX_REMOTE_TOKEN is required" in missing.stderr

    env["SANDBOX_REMOTE_TOKEN"] = "too-short"
    short = subprocess.run(
        ["node", "sandbox/server.mjs"], cwd=ROOT, env=env,
        capture_output=True, text=True, timeout=5,
    )
    assert short.returncode != 0
    assert "at least 16 characters" in short.stderr


def test_sandbox_service_authenticates_before_execution():
    service = read("sandbox/server.mjs")
    assert "const presented = String(req.headers['x-sandbox-token'] || '').trim()" in service
    assert "crypto.timingSafeEqual(a, b)" in service
    assert "if (!ok) return sendJson(res, 401" in service
    assert "req.method === 'POST' && url.pathname === '/execute'" in service


def test_sandbox_service_bounds_requests_and_commands():
    service = read("sandbox/server.mjs")
    assert "function readBody(req, limit = 32 * 1024 * 1024)" in service
    assert "Request body too large" in service
    assert "command.length > 20000" in service
    assert "MAX_CONCURRENCY" in service
    assert "active += 1;" in service
    assert "MAX_OUTPUT_BYTES = 2 * 1024 * 1024" in service
    assert "MAX_TIMEOUT_MS = 120000" in service


def test_sandbox_file_materialization_blocks_traversal_and_symlinks():
    service = read("sandbox/server.mjs")
    assert "path.resolve(runDir, rel)" in service
    assert "path.relative(runDir, absolute)" in service
    assert "relative.startsWith('..')" in service
    assert "fs.realpathSync(parentDir)" in service
    assert "fs.lstatSync(absolute).isSymbolicLink()" in service
    assert "Sandbox file path escapes sandbox" in service


def test_execution_container_has_restrictive_runtime_controls():
    service = read("sandbox/server.mjs")
    for flag in (
        "'--network=none'", "'--read-only'", "'--cap-drop=ALL'",
        "'--security-opt=no-new-privileges'", "'--pids-limit=128'",
        "'--memory=512m'", "'--cpus=1'", "'--ipc=none'",
        "'--user', '65532:65532'",
    ):
        assert flag in service, f"missing container control: {flag}"


def test_app_sandbox_never_inherits_application_secrets():
    app = read("server/sandbox.ts")
    assert "Allowlist sandbox environment" in app
    assert "const allowedEnvKeys = new Set(" in app
    assert "...process.env" not in app
    assert "SANDBOX_RUNTIME !== 'docker'" in app
    assert "Production sandbox execution is disabled" in app
    assert "Sandbox file path escapes sandbox" in app


def test_sandbox_capacity_reservation_happens_before_async_work():
    service = read("sandbox/server.mjs")
    check = service.index("if (active >= MAX_CONCURRENCY)")
    reserve = service.index("active += 1;", check)
    first_await = service.index("await ensureImage()", reserve)
    assert check < reserve < first_await


def test_execution_cleanup_is_registered_for_every_reserved_request():
    service = read("sandbox/server.mjs")
    assert "finally {" in service
    assert "if (reserved) active = Math.max(0, active - 1)" in service
    assert "fs.rm(runDir, { recursive: true, force: true }" in service
    assert "docker', ['rm', '-f', containerName]" in service
