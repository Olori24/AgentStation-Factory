from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")

def test_auth_fails_closed_and_requires_production_secrets():
    auth = read("server/auth.ts")
    assert "ENCRYPTION_KEY || 'agentstation-super-secret" not in auth
    assert "SESSION_SECRET" in auth
    assert "AUTH_BOOTSTRAP_TOKEN" in auth
    assert "Authentication required" in auth
    assert "req.user = getActiveUser()" not in auth

def test_privileged_api_is_server_authorized():
    server = read("server.ts")
    assert 'app.post("/api/tools/execute", requireRole(["admin","engineer"])' in server
    assert 'app.post("/api/sandbox/execute", requireRole(["admin","engineer"])' in server
    assert 'app.post("/api/github/push", requireRole(["admin","engineer"])' in server
    assert 'app.post("/api/tasks/:id/approve", requireRole(["admin"])' in server

def test_webhook_and_security_headers_are_present():
    server = read("server.ts")
    assert "verifyWebhookSignature" in server
    assert "X-Content-Type-Options" in server
    assert "X-Frame-Options" in server
    assert "Strict-Transport-Security" in server

def test_ssrf_and_workspace_boundaries_are_enforced():
    tools = read("server/tools/index.ts")
    assert "assertSafeRemoteUrl" in tools
    assert "metadata.google.internal" in tools
    assert "assertWorkspacePath" in tools
    assert "if (sensitivity.isSensitive) {" in tools
    assert "&& !params.skipApprovalCheck" not in tools

def test_sandbox_fails_closed_in_production():
    sandbox = read("server/sandbox.ts")
    assert "SANDBOX_ALLOW_HOST_EXECUTION !== 'true'" in sandbox
    assert "Sandbox file path escapes sandbox" in sandbox

def test_terminal_websocket_requires_authentication():
    ws = read("server/terminalWs.ts")
    assert "verifySessionToken" in ws
    assert "401 Unauthorized" in ws
    assert "maxPayload: 1024 * 1024" in ws
