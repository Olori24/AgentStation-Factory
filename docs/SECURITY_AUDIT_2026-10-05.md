# AgentStation Factory — Final Pre-Deployment Security Audit

**Audit date:** 2026-10-06  
**Repository:** Olori24/AgentStation-Factory  
**Baseline:** main `3c4f532ea2ad533cc5923ca42e0aa6e2ca8f9bba`  
**Remediation branch:** security/final-predeploy-hardening-2026-10-06  
**PR:** #34  
**Method:** Repository source/configuration review, route/authorization review, database/schema review, Git-history review, dependency/CI review, secret-pattern review, and security regression coverage review.

## Decision

**NOT APPROVED FOR public production deployment yet.**

The remediation work closes multiple critical application-layer vulnerabilities. The remaining blockers are architectural/runtime issues that cannot be honestly certified from source review alone.

### Blocking risks

1. **Production persistence is still JSON-file based for the main application database.** The PostgreSQL RLS migration covers only the durable company-control-plane tables, while missions, approvals, settings, files, logs and jobs still use `data/agentstation_relational_db.json`. RLS therefore does not protect the majority of application records.
2. **Sandbox isolation is code-hardened but runtime-unverified.** Production requires `SANDBOX_RUNTIME=docker`; the repository does not contain proof that the selected production platform supplies this isolation boundary.
3. **Vercel is not certified for the full workload.** The app uses WebSockets, local filesystem persistence, background workers and Docker sandbox execution. The latest Vercel status for this remediation line is failure/resource provisioning, so Vercel cannot be treated as the certified runtime.
4. **GitHub token handling remains a hardening item.** Some Git operations still construct authenticated remote URLs using `GITHUB_TOKEN`. This keeps the credential out of source code but can expose it to process/diagnostic surfaces. Replace URL credentials with a credential helper or GitHub API before public deployment.

## Findings register

### SEC-001 — Critical — Authentication fail-open

- **Affected:** `server/auth.ts`, `server.ts`
- **Risk:** A default active user would turn missing authentication into implicit identity.
- **Fix:** Authentication middleware now validates a signed, expiring session and returns 401 when invalid. Production requires `SESSION_SECRET`.
- **Verification:** Unauthenticated protected API requests must return 401.
- **Status:** Fixed.

### SEC-002 — Critical — Privileged route authorization

- **Affected:** Git operations, sandbox, terminal, tools, jobs, autonomy, simulation, agent execution, mission mutation routes.
- **Risk:** Authentication alone is insufficient for administrative operations.
- **Fix:** Server-side `requireRole([...])` gates were added to privileged routes.
- **Verification:** Authenticated reviewer/normal user receives 403 from admin/engineer-only routes.
- **Status:** Fixed in remediation branch.

### SEC-003 — Critical — Command execution isolation

- **Affected:** `server/sandbox.ts`, `server/terminalWs.ts`
- **Risk:** Host-shell execution can become full server compromise.
- **Fix:** Production fails closed unless Docker sandbox runtime is selected; sandbox uses no network, read-only root, dropped capabilities, no-new-privileges, non-root execution and resource limits.
- **Verification:** Production execution without Docker returns a controlled failure; sandbox cannot reach host filesystem/network.
- **Status:** Code fixed; runtime certification open.

### SEC-004 — High — WebSocket authentication

- **Affected:** `server/terminalWs.ts`
- **Risk:** An unauthenticated terminal socket could become a command-execution bypass.
- **Fix:** Session validation is performed during upgrade; payload and command sizes are bounded.
- **Verification:** Invalid/missing session rejects the socket.
- **Status:** Fixed.

### SEC-005 — High — SSRF and DNS rebinding

- **Affected:** `server/tools/index.ts`, Ollama execution path.
- **Risk:** User-controlled URLs could target localhost, cloud metadata or private networks.
- **Fix:** HTTP(S)-only validation, private/link-local/metadata blocking, DNS resolution checks, and client-controlled Ollama URLs removed from production configuration.
- **Verification:** localhost, RFC1918, link-local, metadata and DNS-to-private targets are rejected.
- **Status:** Fixed in code; live network testing still required.

### SEC-006 — High — Filesystem traversal

- **Affected:** `server.ts`, `server/tools/index.ts`, file APIs.
- **Risk:** Prefix checks can be bypassed by sibling paths such as `workspace-evil`.
- **Fix:** `path.resolve()` plus `path.relative()` boundary checks.
- **Verification:** `../secret`, absolute paths and sibling-prefix paths are rejected.
- **Status:** Fixed in remediation branch.

### SEC-007 — High — Approval bypass

- **Affected:** `server/tools/index.ts`, `/api/tasks/:id/approve`.
- **Risk:** A client flag must never bypass a server-side approval policy.
- **Fix:** Sensitive actions ignore client attempts to skip approval; approval resolution is tied to the authenticated mission owner/organization.
- **Verification:** `skipApprovalCheck=true` cannot execute a sensitive action without required approval.
- **Status:** Fixed.

### SEC-008 — High — Webhook authenticity

- **Affected:** `/api/github/webhook`
- **Risk:** Forged GitHub requests could trigger automation.
- **Fix:** HMAC SHA-256 verification using `GITHUB_WEBHOOK_SECRET`.
- **Verification:** Forged signature returns 401; valid signature is accepted.
- **Status:** Fixed.

### SEC-009 — High — Historical cryptographic secret

- **Affected:** Git history / previous `server/auth.ts`.
- **Risk:** A hard-coded encryption secret existed historically. If used for real encrypted data, it must be considered compromised.
- **Fix:** Production now requires `ENCRYPTION_KEY`; unsafe historical fallback removed.
- **Verification:** Scan all reachable history and rotate any real secret protected by the old key.
- **Status:** Current source fixed; historical rotation remains operational work.

### SEC-010 — High — Object-level authorization

- **Affected:** missions, tasks, files, approvals, artifacts.
- **Risk:** A valid user could access another user's resource by changing an ID.
- **Fix:** Mission ownership is checked server-side; task creation records authenticated owner/org; approvals and artifact access are tied to mission access.
- **Verification:** Cross-user/cross-tenant ID substitution returns 403/404.
- **Status:** Application-layer protections materially improved; durable database/RLS blocker remains.

### SEC-011 — High — Auth token exposure

- **Affected:** `/api/auth/me`, `/api/auth/switch`.
- **Risk:** Returning session tokens in JSON makes browser extensions, logs, debugging tools and accidental client persistence more likely to capture credentials.
- **Fix:** Session remains an HttpOnly cookie; auth endpoints no longer return session tokens; profile switching is disabled.
- **Verification:** Auth responses contain no session token.
- **Status:** Fixed.

### SEC-012 — High — Database/RLS architecture mismatch

- **Affected:** `server/db.ts`, `db/migrations/005_tenant_security.sql`.
- **Risk:** PostgreSQL RLS cannot protect records that are actually stored in a local JSON file.
- **Fix required:** Move tenant-owned application records to the production PostgreSQL database, enable RLS on every applicable table, and set transaction-local user/org context from the authenticated server identity.
- **Verification:** Direct SQL tests prove cross-tenant SELECT/INSERT/UPDATE/DELETE isolation.
- **Status:** **Open / deployment blocker.**

### SEC-013 — High — Local filesystem persistence

- **Affected:** `data/agentstation_relational_db.json`, `data/artifacts`, `workspace`.
- **Risk:** Local state is not reliable or isolated across horizontally scaled/serverless instances and can expose sensitive artifacts.
- **Fix required:** PostgreSQL for durable records and object storage for artifacts/workspaces with least-privilege credentials and explicit retention.
- **Verification:** Restart/second-instance/restore tests preserve only authorized data.
- **Status:** Open.

### SEC-014 — Medium — Process-local rate limiting

- **Affected:** API rate limiter in `server.ts`.
- **Risk:** A process-local map does not provide consistent limits across multiple instances.
- **Fix required:** Shared Redis/edge/API-gateway limiter in production.
- **Verification:** Multiple instances share the same quota and return 429 consistently.
- **Status:** Partially fixed.

### SEC-015 — Medium — Dependency security

- **Affected:** `package.json`, CI.
- **Risk:** Known vulnerable dependencies can become an exploitable supply-chain path.
- **Fix:** CI runs `npm audit --audit-level=high`; `qs` is pinned to 6.16.0.
- **Verification:** CI dependency audit passes on the exact deployment commit.
- **Status:** Previous remediation CI passed; current PR #34 has not yet produced a GitHub Actions run, so final verification is pending.

### SEC-016 — Medium — GitHub credential handling

- **Affected:** Git fetch/push code in `server.ts`.
- **Risk:** Token-in-URL credentials can leak through process arguments, diagnostics or accidental logging.
- **Fix required:** Use a short-lived credential helper/environment-only authentication or GitHub API operations.
- **Verification:** Process list, Git config, remote URL and logs contain no token.
- **Status:** Open.

### SEC-017 — Medium — Error disclosure

- **Affected:** API catch blocks.
- **Risk:** Returning raw `err.message` can disclose infrastructure details.
- **Fix required:** Return stable public error codes/messages and log detailed errors only server-side with secrets/redaction.
- **Verification:** Production 4xx/5xx responses contain no stack traces, tokens, SQL, file paths or provider credentials.
- **Status:** Partially fixed; further normalization required.

### SEC-018 — Medium — File/artifact upload safety

- **Affected:** artifact bundling and file APIs.
- **Risk:** Zip-slip, oversized content and uncontrolled workspace writes can exhaust or escape intended storage.
- **Fix:** Artifact count/size caps, normalized zip paths, workspace boundary checks and bounded request body.
- **Verification:** traversal archive entries and oversized bundles are rejected.
- **Status:** Fixed in remediation branch; live storage tests pending.

### SEC-019 — Medium — Financial/provider information

- **Affected:** AgentRouter wallet/usage endpoints.
- **Risk:** Provider balance/usage can be commercially sensitive.
- **Fix:** Admin-only authorization.
- **Verification:** Non-admin receives 403.
- **Status:** Fixed.

### SEC-020 — Medium — Admin observability endpoints

- **Affected:** database metrics, jobs, webhook history, stream test emitter.
- **Risk:** Operational data can reveal sensitive mission state.
- **Fix:** Admin/appropriate-role gates.
- **Verification:** Reviewer cannot read admin-only telemetry or emit test events.
- **Status:** Fixed in remediation branch.

### SEC-021 — Low — Browser localStorage

- **Affected:** `src/App.tsx`
- **Risk:** Mission history/provider/model preferences in localStorage can expose non-auth application data to same-origin XSS.
- **Important:** This is **not** an authentication-token storage finding; the session token is not stored there.
- **Fix required:** Prefer server-backed history and minimize sensitive client persistence.
- **Status:** Low / open.

### SEC-022 — Low — Development Vite host configuration

- **Affected:** Vite dev-server configuration.
- **Risk:** Broad host allowance is unsafe if a development server is exposed publicly.
- **Fix required:** Restrict allowed hosts or bind development only to localhost.
- **Status:** Open; must never expose the dev server publicly.

### SEC-023 — High — Production runtime incompatibility

- **Affected:** `vercel.json`, `render.yaml`, WebSocket server, local disk, Docker sandbox.
- **Risk:** Treating Vercel and Render as interchangeable can result in a deployment that silently lacks required execution/storage guarantees.
- **Fix required:** Select one certified production runtime and verify WebSocket/background-worker/container/storage behavior.
- **Status:** Open / deployment blocker. Current Vercel status is failing.

## Control-by-control conclusion

| # | Control | Result |
|---|---|---|
| 1 | Admin authentication/authorization | Fixed in application layer |
| 2 | Server-side permissions | Fixed for reviewed privileged routes |
| 3 | Own-record access | Improved; durable DB blocker remains |
| 4 | RLS | Partially implemented for PostgreSQL control-plane; not covering JSON database |
| 5 | Email verification | Not implemented; bootstrap-token auth is used instead of password/email auth |
| 6 | Password hashing | N/A because password authentication is not implemented |
| 7 | Token browser storage | Session is HttpOnly cookie; token no longer returned by auth API |
| 8 | Server-side secrets | Current source uses server-side env variables |
| 9 | Env exposure | `.env*` ignored; public example contains placeholders |
| 10 | Secrets removed from GitHub | Current tree clean; historical key exposure documented |
| 11 | Git-history secret review | Targeted history review found historical encryption-key material; no evidence of committed live API tokens from the reviewed patterns |
| 12 | Sensitive logs/errors | Mostly redacted; raw provider/infrastructure error handling remains |
| 13 | Parameterized DB queries | Neon company-control-plane queries use parameters; JSON DB has no SQL injection surface |
| 14 | Server validation | Basic validation present; schema-level validation should be expanded |
| 15 | XSS | React rendering is used; CSP added; no known `dangerouslySetInnerHTML` path identified in reviewed app code |
| 16 | File uploads | Bounded and traversal-safe in remediation branch |
| 17 | Webhook signatures | HMAC verification implemented |
| 18 | Rate limits | Present but process-local |
| 19 | Security headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS and CSP implemented |
| 20 | Least privilege storage | Not fully certified because production storage architecture is unresolved |
| 21 | API authentication/authorization | Broad authentication middleware plus route-level roles; object-level checks added where reviewed |
| 22 | Production debug errors | No debug mode intentionally enabled; error normalization remains incomplete |
| 23 | Dependencies | CI audit gate present; final PR verification pending |
| 24 | Unused packages/routes | No complete dead-code proof was established; do not claim removal is complete |
| 25 | Exposed files/secrets/config | `.env*` ignored and current placeholders are safe; historical cryptographic material requires rotation decision |

## Required pre-deployment verification

1. Migrate all tenant-owned application state from JSON persistence to PostgreSQL.
2. Apply and test RLS for every applicable tenant-owned table.
3. Set RLS session context from authenticated server identity; never trust client-supplied org/user values.
4. Deploy and independently test the Docker sandbox boundary.
5. Choose and certify one production runtime.
6. Replace Git token-in-URL authentication.
7. Run the full CI suite on PR #34 and record the exact green commit.
8. Run authenticated cross-tenant integration tests.
9. Run unauthenticated/role-negative API tests.
10. Run production smoke tests with secrets redacted.
11. Rotate any real credentials ever encrypted with the historical hard-coded key.
12. Establish backup/restore and incident-response procedures.

## Final verdict

**The application is not yet certified secure for public production.**

The application-layer remediation is substantially stronger, and the final hardening branch closes several concrete vulnerabilities. However, the JSON-vs-PostgreSQL/RLS mismatch, unverified Docker isolation, runtime incompatibility, and remaining Git credential handling prevent an honest green security sign-off.


## Remediation continuation — 2026-10-06

### Additional fixes completed

- **Production persistence is now fail-closed.** `server/db.ts` requires `AGENTSTATION_STORAGE=postgres` and `DATABASE_URL` in production. Local JSON storage remains development-only.
- **Durable PostgreSQL state store added.** `agentstation_state` stores the complete application state as JSONB per organization. Production startup waits for the database state to load before serving requests.
- **RLS is actually enabled on the production state table.** The Neon main branch now reports `relrowsecurity=true`, `relforcerowsecurity=true`, and an active policy for `agentstation_state`.
- **The previous `005_tenant_security.sql` migration was removed.** The live Neon database does not contain the `companies`/`missions` tables assumed by that migration, so keeping it would create a false security claim and a migration failure risk.
- **The old file-backed `missions_store.json` API was removed.** Mission CRUD now uses the authenticated database layer and server-side ownership checks.
- **Unprovisioned company-control-plane routes are disabled with HTTP 410** instead of failing against nonexistent tables.
- **Terminal WebSocket authorization was hardened.** Authentication now uses the HttpOnly session cookie; command execution requires admin/engineer role and an authorized mission; subscriptions are ownership-checked; broadcasts no longer leak mission streams to unsubscribed sockets; concurrent execution per socket is limited.
- **Sandbox environment inheritance was replaced by an allowlist.** Application/database/API secrets are no longer inherited by sandbox containers. Output is capped at 2 MB per stream and additional container restrictions were added.
- **Health endpoint no longer exposes whether a Gemini key is configured.**
- **Authentication session lifetime reduced to one hour.** Session tokens are statelessly signed so authentication works consistently across instances.
- **Auth responses use `Cache-Control: no-store`.**
- **GitHub token-in-URL authentication was removed from Git fetch/push operations.** Git now receives the token through an environment-based HTTP authorization header.
- **CI now requires `npm ci` and scans Git history with Gitleaks.**
- **Known vulnerable transitive dependencies were pinned to patched releases:** `proxy-addr 2.0.8` and `source-map-js 1.2.2`.
- **File batch operations now have file-count and aggregate-size limits.**
- **Rate-limit state is bounded to prevent attacker-controlled memory growth.**

### Current database verification

The production Neon database `twilight-credit-89574302` / `neondb` currently contains the existing autonomy tables plus the new `agentstation_state` table. Direct inspection confirmed:

- RLS enabled: **yes**
- FORCE RLS enabled: **yes**
- Security policy present: **yes**

The old 005 migration's referenced `public.companies` table was not present before the new state-store migration, confirming that 005 could not have been the application's actual tenant boundary.

### Latest CI observation

A CI run for an earlier PR merge ref failed at `npm audit --audit-level=high` with:
- `proxy-addr` critical vulnerability
- `source-map-js` high vulnerability

Those dependencies have now been pinned to patched releases. The latest remediation head is `c63d65f5ee8f3b74da13d9b5c6a047391ff1dd14`. A fresh GitHub Actions result for this exact head is still pending and therefore is **not claimed green**.

### Revised deployment decision

The system is now materially safer and has a real durable PostgreSQL persistence path with enforced RLS at the organization state boundary.

It is **still not certified for public production** until:

1. CI is green on the latest remediation head.
2. The production runtime is verified to provide the required Docker sandbox boundary.
3. A real `DATABASE_URL` is configured in the production secret store.
4. The PostgreSQL state-store migration is included in the production migration process.
5. Cross-user and cross-organization integration tests are executed against the production-like database.
6. The remaining GitHub credential flow is reviewed for minimum token permissions and preferably replaced with GitHub App installation credentials.
7. Historical credentials protected by the old hard-coded encryption secret are rotated if they were ever real.

### Important distinction

The application is **not being declared "secure" merely because the database now has an RLS table**. RLS protects the durable organization state row; application-layer authorization still protects user-owned mission objects inside that state. Both controls are required.


### Third hardening pass — 2026-10-06

Additional application-level findings were closed after the second pass:

- Removed personal email/identity values from source defaults and automated Git configuration.
- Added production feature flags that keep terminal/sandbox execution disabled until the runtime is independently certified.
- Added mission ownership checks to direct terminal and sandbox APIs.
- Closed an Ollama status endpoint SSRF path by removing client-controlled URLs and validating the server-configured endpoint.
- Closed a WebSocket mission-stream authorization leak and bound terminal execution to authenticated mission access.
- Removed project-root fallback from the AI `file_read` tool. It can no longer read arbitrary repository files or `.env`-style secrets.
- Hardened workspace path handling against traversal and existing symlink escapes.
- Added sensitive-path blocking for `.env`, key/certificate and Git metadata paths.
- Added 2 MB file/document limits and 2,000-entry workspace listing limits.
- Redacted secret-shaped values from tool audit records and stopped storing tool error stacks.
- Prevented sensitive files from entering downloadable artifact bundles.
- Removed raw orchestrator execution errors from streamed client events.
- Bound approval resolution to the exact mission and authenticated responder identity.
- Restricted task execution options to an explicit allowlist.
- Added a transactional migration runner and Render pre-deploy migration hook.
- Render production is pinned to one instance because the snapshot-backed compatibility layer is not certified for multi-instance concurrent writes.
- Render production has autonomous and terminal execution disabled by default.

### Remaining hard blockers

1. **Production sandbox runtime certification:** execution is intentionally disabled until Docker isolation is verified on the actual production host. This is a fail-closed state, not a security vulnerability.
2. **CI certification:** the latest GitHub Actions run is currently in progress. Do not claim green until the latest head completes every dependency, secret-scan, build, type-check and security-regression step.
3. **Production secret configuration:** `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `AUTH_BOOTSTRAP_TOKEN`, and the required provider secrets must be supplied through the production secret manager. No secret values belong in the repository.
4. **Historical secret rotation:** the historical hard-coded encryption material remains an operational rotation requirement if it ever protected real encrypted data.
5. **GitHub credential minimum privilege:** Git token transport was hardened, but the remaining token should be replaced with a GitHub App installation credential with minimum repository permissions before enabling automated push/PR actions in production.
6. **Full relational decomposition:** the current PostgreSQL state store provides durable organization-level RLS, while the application maintains user-level ownership inside the JSONB state. This is an intentional compatibility bridge, not the final normalized multi-tenant schema. A fully normalized PostgreSQL model is still the preferred long-term architecture.
