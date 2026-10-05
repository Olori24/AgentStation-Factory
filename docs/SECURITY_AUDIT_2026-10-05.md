# AgentStation Factory — Pre-Deployment Security Audit

**Audit date:** 2026-10-05  
**Repository:** 'Olori24/AgentStation-Factory'  
**Audited ref:** 'security/pre-deployment-audit-2026-10-05'  
**Baseline commit:** '3c4f532ea2ad533cc5923ca42e0aa6e2ca8f9bba'  
**Method:** Manual source review, configuration review, Git-history review, security regression tests, and CI verification.

This audit follows the supplied Pre-Deployment Security Audit Template, including authentication/authorization, data access, secrets, input/output security, API security, dependency/repository hygiene, logging/incident readiness, and deployment review.

## Executive result

**Current status: NOT APPROVED FOR PUBLIC PRODUCTION DEPLOYMENT.**

The remediation branch fixes several critical classes of vulnerabilities, but two architectural blockers remain:

1. **True sandbox isolation is not yet implemented.** The application currently executes shell commands through the host process. Production host execution is now fail-closed unless explicitly configured for host execution, but enabling it would be unsafe. A real container/VM sandbox with resource and network isolation is required before enabling execution in production.
2. **Per-user/tenant object authorization is incomplete.** The application has user and organization fields, but several mission/company/workspace APIs still operate on shared records without a complete server-side ownership policy. This violates the requirement that users access only their own records where ownership is relevant.

A third important readiness issue remains:

3. **The frontend has no completed login/bootstrap flow for the new fail-closed API authentication.** Existing UI requests do not attach an authenticated bearer session. This must be integrated with a real login/identity mechanism before deployment.

## Findings register

| ID | Severity | Area | Finding | Remediation | Status |
|---|---|---|---|---|---|
| SEC-001 | Critical | Authentication | Authentication middleware previously failed open to a default active user. | Replaced with signed, expiring session validation; unauthenticated requests now return 401. Added controlled bootstrap-token login. | Fixed |
| SEC-002 | Critical | Authorization | High-risk APIs were reachable without authentication/role enforcement. | Added server-side role gates to Git operations, sandbox/terminal execution, tool execution, approvals, autonomy controls, file mutations, and mission mutations. | Fixed |
| SEC-003 | Critical | Command execution | Sandbox was a host bash process, not a security isolation boundary. | Production now fails closed unless explicitly configured for host execution. A real containerized sandbox remains required. | Open — deployment blocker |
| SEC-004 | High | WebSocket | Terminal WebSocket upgrade had no authentication. | Added session-token validation during upgrade, payload cap, and command-size validation. | Fixed |
| SEC-005 | High | SSRF | Web fetch tool accepted arbitrary HTTP(S) destinations, including private/metadata networks. | Added URL validation blocking localhost, RFC1918, link-local, metadata and internal targets. | Fixed |
| SEC-006 | High | Filesystem | Tool file reads could fall back to the whole project directory; several path checks used weak prefix logic. | Restricted tool filesystem access to workspace and added canonical relative-path boundary checks. | Fixed |
| SEC-007 | High | Approval bypass | Client-controlled skipApprovalCheck could bypass sensitive-action approval. | Sensitive actions always require approval regardless of client flag. | Fixed |
| SEC-008 | High | Webhooks | GitHub webhook endpoint did not verify a signature. | Added HMAC SHA-256 verification with GITHUB_WEBHOOK_SECRET. | Fixed |
| SEC-009 | High | Secrets | Production encryption/session secrets had unsafe defaults; historical source contained a hard-coded encryption secret. | Removed hard-coded fallback; production requires ENCRYPTION_KEY and SESSION_SECRET. Historical exposure must be treated as a reason to rotate any secrets protected with the old key. | Fixed in current source; rotate if previously used |
| SEC-010 | High | Object authorization | Mission/company/workspace access is not consistently scoped to the authenticated user's ownership. | Requires owner/tenant-aware policy and database enforcement before public deployment. | Open — deployment blocker |
| SEC-011 | High | Frontend auth | Existing frontend API calls do not consistently attach the new authenticated session. | Add a real login/session bootstrap UX using an HttpOnly-cookie or secure bearer-session mechanism; never ship bootstrap secrets to the browser. | Open — deployment blocker |
| SEC-012 | Medium | Database | Neon/PostgreSQL schema contains multi-tenant concepts but does not currently demonstrate RLS policies for application records. | Add and test PostgreSQL RLS or equivalent server-side ownership enforcement for every tenant-owned table. | Open |
| SEC-013 | Medium | Storage | Local JSON persistence and filesystem workspace are not suitable as the sole production data layer for a horizontally scaled/serverless deployment. | Use durable PostgreSQL/object storage and explicit backup/restore procedures. | Open |
| SEC-014 | Medium | Rate limiting | Original API surface lacked abuse controls. | Added process-local API rate limiting. Production should use a shared/distributed limiter for multiple instances. | Partially fixed |
| SEC-015 | Medium | Dependencies | Dependency vulnerability audit is now a CI gate. | npm audit --audit-level=high added to CI; final result must be verified by a green CI run. | Verification pending |
| SEC-016 | Low | Dev server | Vite development configuration allows all hosts. | Development-only configuration should be restricted for shared environments; do not expose the Vite dev server publicly. | Open |
| SEC-017 | Medium | Deployment | The repository contains both Vercel and Render deployment configurations with materially different runtime characteristics. | Select one production runtime and certify its environment, storage, WebSocket behavior, and background-worker model. | Open |

## Controls reviewed

### A. Authentication and authorization

- Admin routes: server-side role gates added to privileged operations.
- Server-side permissions: no longer dependent on hidden frontend controls.
- Session validation: signed, expiring bearer sessions with server-side active-session tracking.
- Bootstrap: requires AUTH_BOOTSTRAP_TOKEN.
- Password authentication/email verification: **not implemented**.
- Token browser storage: no evidence of application code storing the session token in localStorage/sessionStorage; frontend integration remains incomplete.
- Privilege escalation: /api/auth/switch and user enumeration are now admin-only.
- WebSocket authentication: enforced during upgrade.

### B. Database and data access

- Parameterized Neon SQL is used in server/companyControlPlane.ts.
- Tenant ownership is not consistently enforced across all records.
- PostgreSQL RLS is not present in the supplied migrations.
- Local JSON database remains present and should not be treated as a production-grade multi-instance database.
- Sensitive records require an explicit ownership model before public launch.

### C. Secrets and configuration

- Production now requires ENCRYPTION_KEY and SESSION_SECRET.
- Production configuration explicitly disables host shell execution.
- .env.example contains placeholders rather than credentials.
- Git history review found the original hard-coded encryption secret in the initial server/auth.ts commit. This is not evidence that an external API credential was leaked, but it is cryptographic key material and must be considered compromised if it was ever used to encrypt real secrets.
- Historical .env, .env.local, .pem, .key, and credentials path-history queries returned no commits.

### D. Input, output and web security

Implemented:
- Security response headers.
- Request body size limit.
- SSRF blocking for private/metadata network targets.
- Workspace path canonicalization.
- GitHub webhook HMAC verification.
- WebSocket payload limit and command-size validation.

Remaining:
- A production-grade CSP should be validated against the actual deployed frontend.
- File upload/content validation is not a major first-class feature in the current API, but any future upload endpoint must enforce type/size/content checks.

### E. API and endpoint security

High-risk mutation endpoints now require authenticated roles. The remaining key gap is object-level authorization: authentication proves who the caller is, but not every endpoint currently proves that the caller owns the requested mission/company/workspace resource.

### F. Dependencies and repository hygiene

- Root CI now runs npm audit --audit-level=high.
- Type checking/build remain required.
- Static security regression tests were added at tests/security_static_audit.py.
- No tracked environment/private-key files were found through the targeted Git-history path checks.

### G. Logging and incident readiness

- Authentication and authorization failures return safe generic messages.
- Sensitive values should continue to be excluded from logs.
- Credential rotation is required for any historical secret exposure.
- Backup/restore and incident-response procedures are not yet demonstrated for the complete production architecture.

### H. Final deployment review

The final deployment gate remains red until:
- true sandbox isolation is deployed;
- per-user/tenant authorization is complete and tested;
- frontend authentication is integrated;
- database/storage production architecture is certified;
- CI passes dependency audit, lint, build and security regression tests;
- production smoke tests are completed.

## Required verification scenarios

| Test | Expected |
|---|---|
| Unauthenticated request to protected API | 401 |
| Normal user invokes admin-only operation | 403 |
| Client sets skipApprovalCheck=true for sensitive action | Approval still required |
| WebSocket connects without valid session | 401 / connection rejected |
| Forged GitHub webhook | 401 |
| Web fetch to localhost/private/metadata address | Rejected |
| Workspace path ../secret | Rejected |
| Production host-shell execution without explicit unsafe override | Rejected |
| Production API error | No credentials/stack traces exposed |
| High dependency vulnerability | CI fails |

## Required pre-deployment actions

1. Implement a real production sandbox runtime (container/VM) with:
   - no host filesystem access;
   - no host credentials;
   - restricted/no network by default;
   - CPU/memory/PID/time limits;
   - ephemeral filesystem;
   - non-root execution;
   - controlled artifact egress.
2. Complete owner/tenant authorization for missions, companies, tasks, approvals, files, artifacts, settings, logs and workspace operations.
3. Add PostgreSQL RLS or an equivalent tested server-side authorization model.
4. Integrate frontend login/session handling without exposing bootstrap secrets.
5. Run and pass dependency audit, type check, build and all security regression tests.
6. Rotate any real credentials that were ever protected by the historical hard-coded encryption key.
7. Establish production backup/restore and incident-response procedures.
8. Certify one production runtime instead of treating Vercel and Render as interchangeable deployment targets.

## Overall decision

**NOT APPROVED FOR DEPLOYMENT**

The remediation branch materially improves the security posture and closes several critical vulnerabilities, but the remaining sandbox, tenant authorization, and authentication-integration gaps are sufficient to block public production launch.

This audit intentionally records unresolved risks rather than treating a clean-looking build as proof of security.
