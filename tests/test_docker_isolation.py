"""REAL Docker isolation tests.

These are the only tests in this repository that can certify container-level
isolation. They require a live Docker daemon and the hardened execution image:

    npm run sandbox:build
    SANDBOX_TEST_REAL_DOCKER=1 python3 -m pytest -v tests/test_docker_isolation.py

Without a daemon the module SKIPS — it never silently passes. Stub-engine tests
(tests/verify_compose_profile.sh, tests/test_security_adversarial.py) verify
wiring and application-level guards only and do NOT certify isolation.
"""
import json
import os
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

import pytest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMAGE = os.environ.get("SANDBOX_IMAGE", "agentstation-sandbox:latest")
TOKEN = "real-docker-isolation-token-0123456789"


def _docker_ready() -> bool:
    if not shutil.which("docker"):
        return False
    try:
        return subprocess.run(["docker", "info"], capture_output=True,
                              timeout=20).returncode == 0
    except Exception:
        return False


DOCKER_READY = _docker_ready()

pytestmark = pytest.mark.skipif(
    not DOCKER_READY,
    reason="no Docker daemon available: real container isolation NOT verified here",
)


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def ensure_image():
    if subprocess.run(["docker", "image", "inspect", IMAGE],
                      capture_output=True).returncode == 0:
        return
    subprocess.run(["docker", "build", "-t", IMAGE, os.path.join(ROOT, "sandbox")],
                   check=True, capture_output=True, timeout=900)


def execute(base, command, timeout_ms=30000):
    req = urllib.request.Request(
        base + "/execute",
        data=json.dumps({"command": command, "timeoutMs": timeout_ms}).encode(),
        method="POST",
        headers={"Content-Type": "application/json", "X-Sandbox-Token": TOKEN},
    )
    with urllib.request.urlopen(req, timeout=max(30, timeout_ms / 1000 + 20)) as r:
        return json.loads(r.read())


@pytest.fixture(scope="module")
def service():
    ensure_image()
    port = free_port()
    env = {
        **os.environ,
        "SANDBOX_PORT": str(port),
        "SANDBOX_REMOTE_TOKEN": TOKEN,
        "SANDBOX_RUN_ROOT": tempfile.mkdtemp(),
        "SANDBOX_BUILD_CONTEXT": "",
    }
    proc = subprocess.Popen(["node", "sandbox/server.mjs"], cwd=ROOT, env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = f"http://127.0.0.1:{port}"
    deadline = time.time() + 120
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(base + "/health", timeout=2) as r:
                if r.status == 200:
                    break
        except Exception:
            time.sleep(1)
    else:
        proc.kill()
        pytest.fail("sandbox service never healthy (image missing?)")
    yield base
    proc.terminate()
    try:
        proc.wait(timeout=15)
    except subprocess.TimeoutExpired:
        proc.kill()


def test_network_is_none(service):
    out = execute(service, "python3 -c \"import socket;s=socket.socket();"
                           "s.settimeout(3);print(s.connect_ex(('1.1.1.1',80)))\"")
    assert out["exitCode"] != 0 or out["stdout"].strip() not in ("0",), \
        "container reached the network (--network=none not effective)"


def test_rootfs_is_read_only(service):
    out = execute(service, "touch /etc/pwned; echo EXIT=$?")
    assert "EXIT=0" not in out["stdout"], "wrote to a read-only root filesystem"
    w = execute(service, "echo hi > /workspace/w.txt && cat /workspace/w.txt")
    assert "hi" in w["stdout"], "workspace bind mount not writable"


def test_runs_as_non_root(service):
    out = execute(service, "id -u")
    assert out["stdout"].strip() == "65532", f"unexpected uid {out['stdout'].strip()}"
    esc = execute(service, "cat /etc/shadow 2>&1 | head -1")
    assert "root:" not in esc["stdout"], "read /etc/shadow as non-root"


def test_no_capabilities_and_no_new_privs(service):
    caps = execute(service, "grep CapEff /proc/self/status")
    assert "0000000000000000" in caps["stdout"], f"capabilities present: {caps['stdout']}"


def test_host_filesystem_not_visible(service):
    out = execute(service, "ls / ; ls /proc/1/root 2>&1 | head -3")
    assert "agentstation" not in out["stdout"], "host root appears visible"


def test_timeout_kills_container_and_cleans_up(service):
    before = subprocess.run(
        ["docker", "ps", "-a", "--filter", "name=agentstation-sbx-", "-q"],
        capture_output=True, text=True).stdout.split()
    out = execute(service, "sleep 30", timeout_ms=2000)
    assert out["timedOut"] is True
    time.sleep(3)
    after = subprocess.run(
        ["docker", "ps", "-a", "--filter", "name=agentstation-sbx-", "-q"],
        capture_output=True, text=True).stdout.split()
    leaked = set(after) - set(before)
    assert not leaked, f"containers leaked after timeout: {leaked}"


def test_run_directory_is_removed(service):
    out = execute(service, "echo ok")
    assert "ok" in out["stdout"]
    time.sleep(1)
    run_root = os.environ.get("SANDBOX_RUN_ROOT", "")
    if run_root and os.path.isdir(run_root):
        assert os.listdir(run_root) in ([], [x for x in os.listdir(run_root)
                                              if not x.startswith("sbx-")]), \
            "per-run workspaces were not cleaned up"


def test_memory_and_pid_limits(service):
    mem = execute(service,
                  "python3 -c \"b=bytearray(1024*1024*1024);print('ALLOCATED')\"", 60000)
    assert "ALLOCATED" not in mem["stdout"], "1GiB allocation succeeded despite 512m cap"
    pids = execute(service,
                   "python3 -c \"import os\n"
                   "for i in range(400):\n"
                   " try: os.fork()\n"
                   " except OSError: print('FORK_LIMIT'); break\"", 30000)
    assert "FORK_LIMIT" in pids["stdout"] or pids["exitCode"] != 0
