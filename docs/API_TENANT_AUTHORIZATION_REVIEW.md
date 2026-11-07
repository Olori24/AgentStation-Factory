# API Authorization and Tenant-Boundary Review

**Reviewed:** 2026-11-07  
**Branch:** `security/audit-remediation-2026-11-07`  
**Scope:** Route registration and handlers in `server.ts`, plus `server/db.ts`.  
**Status:** Findings only; no unsafe blanket authorization patch applied.

## Confirmed controls

- The `/api` middleware applies session authentication before most API handlers.
- Mission list, detail, delete, start and task-inspection handlers call `db.canAccessMission` or `db.getMissionsForUser`.
- File save/download/delete handlers require an accessible mission ID and perform lexical path-boundary checks.
- Admin-only handlers use `requireRole(["admin"])`.
- The autonomy heartbeat is exempted from session middleware but independently requires a configured `CRON_SECRET` bearer token.
- The GitHub webhook route is exempted from session middleware and uses its own signature verification / delivery-claim path.

## Confirmed tenant and authorization gaps

### A-01: Global JSONB state makes tenant scoping non-authoritative — Critical

Mission ownership checks are performed against records loaded into the shared in-memory snapshot. The persistence layer stores that entire snapshot under the fixed `org-station-01` row. Database RLS therefore does not enforce the organization boundary for each embedded record. See `TENANT_ISOLATION_REMEDIATION_PLAN.md`.

### A-02: Shared workspace filesystem is not tenant-isolated — High

`/api/files/save`, `/api/files/save-batch`, and `/api/files/download` accept a mission ID and verify that the caller can access that mission, but the actual file path is resolved under one process-wide `workspace` directory. Two tenants can therefore write to or read the same relative path if they each supply an authorized mission ID. The mission check does not namespace the filesystem path by tenant or mission.

The lexical `path.resolve` / `path.relative` check also does not prevent symlink traversal inside the workspace. A symlink located beneath the workspace can point outside it while the lexical relative path still appears contained. Save-batch and delete share this concern.

**Required fix:** use tenant- and mission-scoped storage keys/directories, reject symlink components using descriptor-based/no-follow operations where supported, and enforce the same scope on every read/write/delete. Do not rely on caller-provided path names as storage identity.

### A-03: Admin endpoints expose cross-organization data — High

`GET /api/auth/users` returns every user and organization in the global in-memory database. `GET /api/db/snapshot` returns the full snapshot (with password hashes removed). `GET /api/jobs` and `GET /api/jobs/:id` expose global queue state. These endpoints are admin-role protected, but the role check is not organization-scoped. This is a platform-superadmin capability, not tenant admin isolation.

**Required fix:** define a distinct, explicitly provisioned platform-superadmin role and tenant-admin role; tenant admins must only see their organization. Restrict global diagnostics to platform operators, audit access, and avoid returning secrets/configuration or unrelated tenant payloads.

### A-04: Global workspace tree is admin-only, not tenant-scoped — High

`GET /api/files/tree` recursively returns contents from the process-wide workspace directory to any authenticated admin. It has no organization or mission filter. Combined with A-02, this is a shared-data disclosure boundary.

**Required fix:** remove the global tree endpoint from tenant-admin access and return only files in an authorized tenant/mission namespace.

### A-05: Agent task endpoints lack tenant context — High

`GET /api/agents/tasks` accepts an optional mission ID and calls durable/fallback task listing without an explicit user/organization argument. If mission ID is omitted, the route can list tasks across organizations. `POST /api/agents/dispatch` passes request body directly to dispatch functions without binding the authenticated organization or validating mission ownership at the route boundary.

**Required fix:** require a mission ID or an explicitly scoped organization query; resolve ownership server-side; attach organization ID from the authenticated user, never from the client; persist and query tenant scope in the database.

### A-06: Jobs and worker payloads lack tenant authorization context — High

`POST /api/jobs/enqueue` accepts a client-supplied mission ID and enqueues work without checking mission ownership. `GET /api/jobs/:id` retrieves a global job by ID after only a global admin-role check. Workers consume job payloads and mission IDs without a consistently enforced tenant context.

**Required fix:** validate mission ownership before enqueue, persist organization ID on each job, scope all job reads/mutations, and propagate tenant context to workers.

### A-07: Account creation is not transactionally unique — High

Signup performs an in-memory email lookup, appends an organization and user, then flushes the shared snapshot. The reviewed migrations do not establish a unique normalized-email constraint or an atomic organization/user transaction. Concurrent requests or multiple instances can race.

**Required fix:** create normalized users and organizations in PostgreSQL transactionally, enforce a unique normalized email index, and issue a session only after commit.

### A-08: Signup does not verify email ownership — Medium / policy decision

The signup handler issues an authenticated session immediately after account creation and contains no email-verification gate in the reviewed route. If verified email ownership is a product requirement, this enables unverified addresses to become active accounts.

**Required fix:** implement expiring, single-use, hashed verification tokens with rate-limited resend and session restrictions until verification. If email verification is intentionally not required, document the risk acceptance and add compensating abuse controls.

### A-09: General API rate limiter remains process-local — Medium

A later middleware uses an in-memory `Map` keyed by client IP for general API traffic. The dedicated signup/login limiter uses PostgreSQL, but the general API limiter is still per-process and is not a distributed control. In serverless/multi-instance production, limits can be multiplied across instances and reset on cold starts.

**Required fix:** move general API throttling to a shared atomic store or edge gateway; keep per-route policies and trusted proxy configuration explicit.

## Immediate remediation order

1. Stop shared workspace cross-tenant access: namespace all storage by trusted organization and mission IDs; remove global tree exposure to tenant admins.
2. Scope agent tasks, dispatch, jobs and worker payloads to the authenticated tenant.
3. Separate platform superadmin from tenant admin; scope admin data endpoints.
4. Replace the global JSONB snapshot with normalized tenant-owned tables and database-enforced RLS.
5. Make signup atomic with a unique normalized-email constraint and decide/implement email verification.
6. Move general API throttling to a distributed store.
7. Add PostgreSQL integration tests using a restricted non-owner/non-BYPASSRLS runtime role, with explicit cross-tenant denial tests for every resource family.

## Release gate

Do not approve production multi-tenancy while A-01 through A-07 remain open. Passing CI, mission-level in-memory checks, or RLS on the single snapshot row does not close these findings.
