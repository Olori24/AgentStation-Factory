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


def test_github_installation_metadata_is_user_scoped_and_non_secret():
    db = read("server/db.ts")
    assert "export interface GitHubConnectionRecord" in db
    assert "installationId: number" in db
    assert "accountId: number" in db
    assert "setGitHubConnectionForUser(userId: string" in db
    assert "getGitHubConnectionForUser(userId: string" in db
    assert "removeGitHubConnectionForUser(userId: string" in db
    connection = db.split("export interface GitHubConnectionRecord", 1)[1].split("export interface UserRecord", 1)[0]
    assert "accessToken" not in connection
    assert "refreshToken" not in connection
    assert "privateKey" not in connection


def test_public_user_responses_redact_github_connection_metadata():
    server = read("server.ts")
    public_user = server.split("function publicUser", 1)[1].split("\n}", 1)[0]
    assert "passwordHash" in public_user
    assert "githubConnection" in public_user
    assert "_githubConnection" in public_user


def test_github_installation_flow_is_session_bound_and_fail_closed():
    server = read("server.ts")
    db = read("server/db.ts")
    migration = read("db/migrations/007_github_install_states.sql")
    assert 'app.get("/api/github/install", authRateLimit' in server
    assert 'app.get("/api/github/callback"' in server
    assert '"/github/callback"' in server
    assert "GITHUB_APP_ID" in server
    assert "GITHUB_APP_PRIVATE_KEY" in server
    assert "GITHUB_APP_SLUG" in server
    assert "GITHUB_APP_CALLBACK_URL" in server
    assert "as_github_callback" in server
    assert 'sameSite: "lax"' in server
    assert "verifyGitHubCallbackTicket" in server
    assert "createGitHubInstallState" in db
    assert "consumeGitHubInstallState" in db
    assert "DELETE FROM github_install_states" in db
    assert "RETURNING user_id, organization_id, session_hash, expires_at" in db
    assert "github_install_states_tenant_isolation" in migration
    assert "ENABLE ROW LEVEL SECURITY" in migration
    assert "FORCE ROW LEVEL SECURITY" in migration
    assert "state_hash char(64) PRIMARY KEY" in migration


def test_github_installation_tokens_are_short_lived_and_never_persisted():
    server = read("server.ts")
    db = read("server/db.ts")
    assert "/access_tokens" in server
    assert "createUserInstallationToken(userId: string)" in server
    assert 'app.get("/api/github/repositories"' in server
    assert "db.getUserById(userId)" in server
    assert "Authorization: \"Bearer \" + minted.token" in server
    assert "res.setHeader(" in server and '"Cache-Control", "no-store"' in server
    connection = db.split("export interface GitHubConnectionRecord", 1)[1].split("export interface UserRecord", 1)[0]
    assert "accessToken" not in connection
    assert "refreshToken" not in connection
    assert "privateKey" not in connection


def test_github_repository_and_branch_selection_are_installation_scoped():
    server = read("server.ts")
    db = read("server/db.ts")
    modal = read("src/components/GitHubModal.tsx")
    assert 'app.get("/api/github/repositories"' in server
    assert 'app.post("/api/github/repositories/select"' in server
    assert 'app.get("/api/github/repositories/selected/branches"' in server
    assert 'app.post("/api/github/repositories/select-branch"' in server
    assert "createUserInstallationToken(req.user.id)" in server
    assert "repository.id !== repositoryId" in server
    assert "repository.full_name?.toLowerCase() !== fullName.toLowerCase()" in server
    assert "selectedRepositories: [selection]" in server
    assert "selectedRepositories: [{ ...selected, defaultBranch: branchData.name }]" in server
    assert "export interface GitHubRepositorySelection" in db
    assert "selectedRepositories?: GitHubRepositorySelection[]" in db
    assert "agentstation-github-repository" in modal
    assert "Select repository branch" in modal
    assert "legacy push controls are not yet bound" in modal


def test_github_mission_binding_is_owner_scoped_and_pins_base_sha():
    server = read("server.ts")
    db = read("server/db.ts")
    route = server.split('app.post("/api/missions/:id/github-binding"', 1)[1].split('app.delete("/api/missions/:id"', 1)[0]
    mission = db.split("export interface DbMissionRecord", 1)[1].split("export interface WorkspaceFileRecord", 1)[0]
    assert 'mission.userId !== req.user.id' in route
    assert 'mission.organizationId !== req.user.organizationId' in route
    assert 'createUserInstallationToken(req.user.id)' in route
    assert 'requestedBranch !== selected.defaultBranch' in route
    assert 'branchData.commit?.sha' in route
    assert 'githubRepositoryId: selected.id' in route
    assert 'githubInstallationId: connection.installationId' in route
    assert 'baseSha,' in route
    assert 'currentMission.status === "running"' in route
    assert "githubRepositoryId?: number" in mission
    assert "githubInstallationId?: number" in mission
    assert "baseSha?: string" in mission
    assert '"Cache-Control", "no-store"' in route
    assert 'targetRepo: existing?.targetRepo' in server
    assert 'githubRepositoryId: existing?.githubRepositoryId' in server
    assert 'githubInstallationId: existing?.githubInstallationId' in server
    assert 'baseSha: existing?.baseSha' in server
    assert '_clientGithubBinding' in server
    modal = read("src/components/GitHubModal.tsx")
    app = read("src/App.tsx")
    assert 'missionId={mission.id}' in app
    assert 'Bind repository to this mission' in modal
    assert '/github-binding' in modal



def test_mission_repository_workspace_isolated_and_repository_grounded():
    server = read("server.ts")
    sandbox = read("sandbox/server.mjs")
    modal = read("src/components/GitHubModal.tsx")
    app = read("src/App.tsx")
    assert 'app.post("/api/missions/:id/repository/workspace"' in server
    assert 'app.post("/api/missions/:id/repository/execute"' in server
    assert 'mission.userId !== req.user.id' in server
    assert 'mission.organizationId !== req.user.organizationId' in server
    assert 'git/trees/" + mission.baseSha + "?recursive=1' in server
    assert 'isSafeRepositorySnapshotPath(entry.path)' in server
    assert 'entry.size <= 256 * 1024' in server
    assert '1200 * 1024' in server
    assert 'callMissionSandboxWorkspace("/workspace/create"' in server
    assert 'callMissionSandboxWorkspace("/workspace/execute"' in server
    assert 'REPOSITORY CONTEXT (read-only source snapshot' in server
    assert 'files: safeFiles' in server
    assert 'repositoryWorkspace' in server
    assert 'workspace/create' in sandbox
    assert 'workspace/execute' in sandbox
    assert 'WORKSPACE_ID_RE' in sandbox
    assert "rel.includes('\\\\')" in sandbox
    assert 'stat.isSymbolicLink()' in sandbox
    assert "'--network=none'" in sandbox
    assert "'--read-only'" in sandbox
    assert "'--cap-drop=ALL'" in sandbox
    assert "'--user', '65532:65532'" in sandbox
    assert 'Bind repository to this mission' in modal
    assert 'Prepare coding workspace' in modal
    assert 'missionId={mission.id}' in app



def test_repository_diff_is_baselined_and_fake_qa_results_are_removed():
    server = read("server.ts")
    sandbox = read("sandbox/server.mjs")
    ui = read("src/components/CodeWorkspace.tsx")
    types = read("src/types.ts")
    assert "git init -q" in sandbox
    assert "Base repository snapshot" in sandbox
    assert "git diff --no-ext-diff --binary --unified=3" in sandbox
    assert "baseCommitSha" in sandbox
    assert "setWorkspaceOwnership(dir)" in sandbox
    assert "activeWorkspaces" in sandbox
    assert "countedActive" in sandbox
    assert 'diff: String(result.diff || "")' in server
    assert "baseSha: mission.baseSha" in server
    assert "No test result has been recorded." in server
    assert "3 passed in 0.07s" not in server
    assert "100% AUTOMATED QA PASS" not in server
    assert "No sandbox execution has been recorded for this mission." in ui
    assert "Actual repository diff" in ui
    assert "diff?: string" in types
    assert "baseSha?: string" in types
