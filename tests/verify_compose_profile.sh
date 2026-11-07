#!/usr/bin/env bash
#
# Verify the Docker Compose dev-profile wiring end to end WITHOUT a container
# engine, by substituting tests/stub-docker.sh for the `docker` CLI.
#
# It exercises the real code path the compose profile uses:
#
#   app (SANDBOX_RUNTIME=remote)  --HTTP-->  sandbox service  --docker run-->  command
#
# and asserts that a full mission completes and that the sandbox service (not
# the app host) executed the command.
#
# Usage:  bash tests/verify_compose_profile.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STUB_DIR="$(mktemp -d)"
RUN_ROOT="$(mktemp -d)"
SANDBOX_LOG="$(mktemp)"
APP_LOG="$(mktemp)"
TOKEN="verify-token-$$"
SANDBOX_PORT=7070
APP_PORT=3000

cp tests/stub-docker.sh "$STUB_DIR/docker"
chmod +x "$STUB_DIR/docker"

cleanup() {
  [ -n "${APP_PID:-}" ] && kill "$APP_PID" 2>/dev/null
  [ -n "${SANDBOX_PID:-}" ] && kill "$SANDBOX_PID" 2>/dev/null
  wait 2>/dev/null
  rm -rf "$STUB_DIR" "$RUN_ROOT"
}
trap cleanup EXIT

fail() { echo "FAIL: $*"; echo "--- sandbox log ---"; tail -30 "$SANDBOX_LOG"; echo "--- app log ---"; tail -30 "$APP_LOG"; exit 1; }

wait_for() { # url, seconds
  local url="$1" deadline=$(( $(date +%s) + $2 ))
  while [ "$(date +%s)" -lt "$deadline" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}

echo "== 1. start dedicated sandbox service (stub engine) =="
PATH="$STUB_DIR:$PATH" \
SANDBOX_PORT="$SANDBOX_PORT" \
SANDBOX_REMOTE_TOKEN="$TOKEN" \
SANDBOX_RUN_ROOT="$RUN_ROOT" \
SANDBOX_BUILD_CONTEXT="" \
node sandbox/server.mjs >"$SANDBOX_LOG" 2>&1 &
SANDBOX_PID=$!

wait_for "http://127.0.0.1:$SANDBOX_PORT/health" 30 || fail "sandbox service did not become healthy"
echo "   sandbox service healthy: $(curl -fsS http://127.0.0.1:$SANDBOX_PORT/health)"

echo "== 2. start app wired to the sandbox service (SANDBOX_RUNTIME=remote) =="
NODE_ENV=development \
PORT="$APP_PORT" \
SANDBOX_RUNTIME=remote \
SANDBOX_REMOTE_URL="http://127.0.0.1:$SANDBOX_PORT" \
SANDBOX_REMOTE_TOKEN="$TOKEN" \
TERMINAL_EXECUTION_ENABLED=true \
AGENTSTATION_STORAGE=json \
./node_modules/.bin/tsx server.ts >"$APP_LOG" 2>&1 &
APP_PID=$!

wait_for "http://127.0.0.1:$APP_PORT/api/health" 90 || fail "app did not become healthy"
echo "   app healthy: $(curl -fsS http://127.0.0.1:$APP_PORT/api/health)"

echo "== 3. run the end-to-end demo against the running app =="
DEMO_BASE_URL="http://127.0.0.1:$APP_PORT" node scripts/demo.mjs >"$APP_LOG.demo" 2>&1
DEMO_EXIT=$?
cat "$APP_LOG.demo"
[ "$DEMO_EXIT" -eq 0 ] || fail "demo exited with $DEMO_EXIT"

echo "== 4. assertions =="
grep -q "Mission complete" "$APP_LOG.demo" || fail "demo did not report mission completion"
grep -q "sandbox-ok" "$APP_LOG.demo" || fail "sandbox execution did not return expected output"
grep -q "run sbx-" "$SANDBOX_LOG" || fail "sandbox service never received an execution request"
grep -q "exit=0" "$SANDBOX_LOG" || fail "sandbox service did not report a successful execution"

echo "   [ok] mission completed"
echo "   [ok] sandbox output verified (sandbox-ok)"
echo "   [ok] command executed by the dedicated sandbox service, not the app host"
echo
echo "PASS: compose-profile wiring verified end to end (app -> sandbox service -> execution)."
