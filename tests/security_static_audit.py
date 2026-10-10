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
    assert "SANDBOX_RUNTIME !== 'docker'" in sandbox
    assert "spawn('docker'" in sandbox
    assert "--network=none" in sandbox
    assert "--cap-drop=ALL" in sandbox
    assert "--security-opt=no-new-privileges" in sandbox
    assert "Sandbox file path escapes sandbox" in sandbox

def test_terminal_websocket_requires_authentication():
    ws = read("server/terminalWs.ts")
    assert "verifySessionToken" in ws
    assert "401 Unauthorized" in ws
    assert "maxPayload: 1024 * 1024" in ws


def test_browser_auth_is_cookie_based_and_server_owned():
    auth = read("server/auth.ts")
    server = read("server.ts")
    app = read("src/App.tsx")
    assert "httpOnly: true" in server
    assert 'sameSite: "strict"' in server
    assert "api/auth/me" in app
    assert "credentials: 'include'" in app
    assert 'app.post("/api/auth/signup"' in server
    assert 'app.post("/api/auth/login"' in server
    assert "Create account" in app
    assert "Sign in to AgentStation" in app
    assert "bootstrapToken" not in app
    assert "SESSION_COOKIE" in auth

def test_tenant_ownership_and_rls_migration_exist():
    migration_runner = read("scripts/migrate.mjs")
    db = read("server/db.ts")
    assert "migrationsDir" in migration_runner
    assert '"db", "migrations"' in migration_runner
    assert "schema_migrations" in migration_runner
    assert "agentstation_state" in db
    assert "set_config('app.organization_id'" in db
    assert "organizationId" in db
    assert "getMissionsForUser" in db
    assert "canAccessMission" in db


def test_sensitive_read_and_mutation_routes_are_not_public():
    server = read("server.ts")
    assert 'app.get("/api/db/metrics", requireRole(["admin"])' in server
    assert 'app.get("/api/jobs", requireRole(["admin"])' in server
    assert 'app.get("/api/agentrouter/wallet", requireRole(["admin"])' in server
    assert 'app.get("/api/agentrouter/usage", requireRole(["admin"])' in server
    assert 'app.get("/api/autonomy/status", requireRole(["admin"])' in server
    assert 'app.post("/api/simulations/mirofish", requireRole(["admin","engineer"])' in server
    assert 'app.post("/api/missions", requireRole(["admin","engineer"])' in server
    assert 'app.post("/api/agents/run", requireRole(["admin","engineer"])' in server
    assert 'app.post("/api/tools/execute", requireRole(["admin","engineer"])' in server

def test_session_token_is_never_returned_by_profile_endpoints():
    server = read("server.ts")
    assert 'organization: org,\n    token,' not in server
    assert 'res.json({ success: true, user, token' not in server
    assert 'Profile switching is disabled in production' in server

def test_object_ownership_and_path_safety_are_enforced():
    server = read("server.ts")
    db = read("server/db.ts")
    artifacts = read("server/artifacts.ts")
    assert "getApprovalById" in db
    assert "approval.missionId !== missionId" in server
    assert "db.canAccessMission(req.user, missionId)" in server
    assert "path.relative(workspaceDir, target)" in server
    assert 'relativeTarget.startsWith("..")' in server
    assert "zip-slip-safe" in artifacts
    assert "Artifact payload too large" in artifacts

def test_ssrf_defense_includes_dns_resolution():
    tools = read("server/tools/index.ts")
    assert "dns.lookup" in tools
    assert "Resolved address is private or link-local" in tools


def test_production_storage_is_fail_closed():
    db = read("server/db.ts")
    assert "AGENTSTATION_STORAGE" in db
    assert "Production startup blocked: AGENTSTATION_STORAGE must be postgres" in db
    assert "Production startup blocked: DATABASE_URL is required" in db
    assert "agentstation_state" in db

def test_no_legacy_file_mission_store():
    server = read("server.ts")
    assert "missions_store.json" not in server
    assert "ensureMissionsStore" not in server
    assert "saveMissionsStore" not in server

def test_websocket_isolation():
    ws = read("server/terminalWs.ts")
    assert "clientUsers" in ws
    assert "db.canAccessMission(user, missionId)" in ws
    assert "Terminal execution is not permitted" in ws
    assert "this.clientMissionMap.get(ws) !== channelMissionId" in ws
    assert "as_session=" in ws

def test_sandbox_secret_allowlist():
    sandbox = read("server/sandbox.ts")
    assert "Allowlist sandbox environment" in sandbox
    assert "...process.env" not in sandbox
    assert "--network=none" in sandbox
    assert "--cap-drop=ALL" in sandbox
    assert "--ipc=none" in sandbox
    assert "MAX_OUTPUT_BYTES" in sandbox


def test_workspace_tool_boundaries_and_audit_redaction():
    tools = read("server/tools/index.ts")
    artifacts = read("server/artifacts.ts")
    assert "Access denied: sensitive workspace path" in tools
    assert "File exceeds 2MB limit" in tools
    assert "redactForAudit" in tools
    assert "projectPath" not in tools
    assert "Sensitive file cannot be included in an artifact" in artifacts
