#!/usr/bin/env python3
"""
Static validation of the Docker Compose dev profile.

Docker is not available in every environment (including CI sandboxes), so this
checks the compose file and Dockerfiles structurally: service graph integrity,
named volumes, build contexts, env interpolation, and the specific wiring the
profile depends on. It is a fast guard, not a substitute for `docker compose
config` on a machine with Docker.

Usage:  python3 tests/validate_compose.py
"""
import os
import re
import sys

try:
    import yaml
except ImportError:
    print("SKIP: pyyaml not installed")
    sys.exit(0)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPOSE = os.path.join(ROOT, "docker-compose.yml")

errors = []
checks = 0


def check(cond, msg):
    global checks
    checks += 1
    if not cond:
        errors.append(msg)


with open(COMPOSE) as fh:
    raw = fh.read()
doc = yaml.safe_load(raw)

services = doc.get("services", {})
volumes = doc.get("volumes", {}) or {}

# --- service graph -----------------------------------------------------------
check(set(services) == {"app", "sandbox", "sandbox-image"},
      f"unexpected service set: {sorted(services)}")

for name, svc in services.items():
    for dep in (svc.get("depends_on") or {}):
        check(dep in services, f"{name}.depends_on references unknown service '{dep}'")

# --- named volumes -----------------------------------------------------------
for name, svc in services.items():
    for vol in svc.get("volumes", []) or []:
        if isinstance(vol, str) and not vol.startswith((".", "/", "$")):
            vol_name = vol.split(":")[0]
            check(vol_name in volumes, f"{name} uses undeclared named volume '{vol_name}'")

# --- build contexts exist ----------------------------------------------------
for name, svc in services.items():
    build = svc.get("build")
    if isinstance(build, dict):
        ctx = build.get("context", ".")
        dockerfile = build.get("dockerfile", "Dockerfile")
        ctx_path = os.path.normpath(os.path.join(ROOT, ctx))
        check(os.path.isdir(ctx_path), f"{name} build context missing: {ctx}")
        check(os.path.isfile(os.path.join(ctx_path, dockerfile)),
              f"{name} Dockerfile missing: {os.path.join(ctx, dockerfile)}")

# --- env interpolation is well formed ---------------------------------------
for m in re.finditer(r"\$\{([^}]+)\}", raw):
    expr = m.group(1)
    check(re.fullmatch(r"[A-Z0-9_]+(:-.*)?", expr) is not None,
          f"malformed interpolation: ${{{expr}}}")

# --- the wiring the profile depends on --------------------------------------
app_env = services["app"].get("environment", {})
check(app_env.get("SANDBOX_RUNTIME") == "${COMPOSE_SANDBOX_RUNTIME:-remote}",
      "app must default SANDBOX_RUNTIME to remote")
check("SANDBOX_REMOTE_URL" in app_env, "app must set SANDBOX_REMOTE_URL")
check("SANDBOX_REMOTE_TOKEN" in app_env, "app must set SANDBOX_REMOTE_TOKEN")
check(app_env.get("TERMINAL_EXECUTION_ENABLED") == "true",
      "app must enable terminal execution in the dev profile")
check(app_env.get("NODE_ENV") == "development",
      "app must run in development mode (Vite middleware + JSON storage)")

sandbox = services["sandbox"]
check("7070" in [str(p) for p in sandbox.get("expose", [])],
      "sandbox service must expose 7070 on the compose network")
check("ports" not in sandbox,
      "sandbox service must NOT publish a host port (network-only)")
sock = [v for v in sandbox.get("volumes", []) if "docker.sock" in str(v)]
check(len(sock) == 1, "sandbox service must mount the docker socket exactly once")

# run-root must be mounted at the identical path on both sides
def resolve(s):
    """Resolve ${NAME:-default} / ${NAME} so the value can be inspected."""
    s = re.sub(r"\$\{[A-Z0-9_]+:-([^}]*)\}", r"\1", s)
    s = re.sub(r"\$\{[A-Z0-9_]+\}", "x", s)
    return s


run_root_mounts = [v for v in sandbox.get("volumes", []) if "RUN_ROOT" in str(v)]
check(len(run_root_mounts) == 1, "sandbox service must mount the run root")
if run_root_mounts:
    parts = resolve(str(run_root_mounts[0])).split(":")
    check(len(parts) == 2 and parts[0] == parts[1],
          "run root must be mounted at the identical host/container path")

# app must not have engine access
app_vols = " ".join(str(v) for v in services["app"].get("volumes", []))
check("docker.sock" not in app_vols, "app service must NOT mount the docker socket")

# --- Dockerfiles: basic structural sanity -----------------------------------
for rel in ("Dockerfile", "sandbox/Dockerfile", "sandbox/service.Dockerfile"):
    path = os.path.join(ROOT, rel)
    check(os.path.isfile(path), f"missing {rel}")
    if os.path.isfile(path):
        text = open(path).read()
        check(re.search(r"^FROM\s+\S+", text, re.M) is not None, f"{rel}: no FROM")
        check("CMD" in text or "ENTRYPOINT" in text, f"{rel}: no CMD/ENTRYPOINT")

# hardened execution image must keep its isolation flags documented
hard = open(os.path.join(ROOT, "sandbox/Dockerfile")).read()
for flag in ("--network=none", "--read-only", "--cap-drop=ALL", "--user 65532:65532"):
    check(flag in hard, f"sandbox/Dockerfile must document {flag}")

# --- report ------------------------------------------------------------------
if errors:
    print(f"FAIL: {len(errors)} problem(s) across {checks} checks")
    for e in errors:
        print("  -", e)
    sys.exit(1)

print(f"PASS: compose profile validated ({checks} checks)")
