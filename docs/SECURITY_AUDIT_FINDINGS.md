# AgentStation Factory — Security Audit Findings

**Assessment date:** 2026-11-07  
**Scope:** Repository changes on `security/audit-remediation-2026-11-07` compared with base `df1d24e91c8d0fd9a14da7ab33e1fbd437faabc7`.  
**Assessment type:** Code and configuration review. This document is not a penetration-test certificate or a production security attestation.

## Executive assessment

The branch introduces meaningful safeguards around sandbox execution, tenant-scoped mission streaming, production storage configuration, and CI verification. The design separates the app from the Docker socket and delegates execution to a dedicated sandbox service. The service then creates disposable execution containers with restrictive runtime settings.

**The implementation is not yet certified for production.** In particular, the dedicated service still has access to the Docker daemon socket, which is effectively a host-level control boundary; the real-Docker test suite must pass on a real daemon; and the application’s PostgreSQL tenant isolation needs independent schema/RLS and request-path verification. Do not describe these controls as fully secure solely because static checks pass.

## Findings register

### F-01 — Docker daemon socket is a high-impact trust boundary
**Severity:** Critical architectural risk  
**Status:** Mitigated in app tier; residual risk remains

The Compose design does not mount `docker.sock` into the app service. It mounts the socket into the dedicated sandbox service, which invokes Docker to create execution containers. This reduces the number of services with daemon access, but the sandbox service remains highly privileged: compromise of that service or its token boundary may permit Docker API operations beyond the intended one-container execution flow.

**Required follow-up:** Prefer a narrowly scoped container-runtime broker or isolated daemon/VM with no access to sensitive host resources. If the socket architecture is retained, document the residual host-compromise risk, constrain daemon exposure, harden the service container, and test hostile requests against the broker boundary. Do not call this a complete container-escape mitigation.

### F-02 — Sandbox authentication is now fail-closed at the service
**Severity:** High  
**Status:** Code-level mitigation present; deployment verification pending

`sandbox/server.mjs` refuses to start without `SANDBOX_REMOTE_TOKEN` and rejects tokens shorter than 16 characters. The `/execute` endpoint compares the presented token using `crypto.timingSafeEqual` after checking equal buffer lengths. The Compose example documents a required shared secret and the Compose validator checks required interpolation on both services.

**Residual risk:** The app-side helper still represents a missing token as an empty string and omits the header when empty. The sandbox rejects such calls, but the deployment must prove that both services receive the same high-entropy secret. A 16-character minimum is not a substitute for entropy and secret rotation. Keep the token out of logs, images, source control, and client-visible configuration.

### F-03 — Mission SSE streaming has owner/tenant authorization checks
**Severity:** High  
**Status:** Behavioral test added; broader route coverage pending

`tests/streaming_isolation.ts` creates two users in separate organizations and an anonymous client, then verifies that a mission event reaches only the authorized owner while a channel-less heartbeat remains broadcast. This is a useful behavioral regression test.

**Residual risk:** This single test does not prove authorization for every API route, mission mutation, file retrieval, approval, job, or administrative action. Review every route and data access path. Ensure admin privileges are server-verified and scoped to the intended organization.

### F-04 — PostgreSQL production storage is enforced, but tenant isolation is not certified
**Severity:** Critical / High pending schema and route review  
**Status:** Partially mitigated; independent verification required

`server/db.ts` blocks production startup unless PostgreSQL storage is selected and a database URL is present. It also provides a flush operation intended to persist state before serverless suspension. The visible implementation stores an organization-scoped state row and sets `app.organization_id` in a transaction.

**Residual risk:** The code shown uses a fixed `DEFAULT_ORG` identifier for state load and persistence. This does not by itself demonstrate multi-tenant isolation. The database schema, RLS policies, role grants, transaction boundaries, and all query paths must be inspected and tested. Do not infer that setting a session variable enforces RLS unless the deployed schema and database role prove it.

### F-05 — Disposable execution containers have restrictive runtime flags
**Severity:** High  
**Status:** Controls implemented; real-daemon verification pending

The execution service starts containers with `--network=none`, `--read-only`, a constrained writable tmpfs, `--cap-drop=ALL`, `no-new-privileges`, PID/memory/CPU/file-descriptor limits, and UID/GID 65532. Commands are passed as arguments to the Docker CLI rather than executed as a host-side shell command. Per-run workspace paths are checked against traversal and symlink escapes before writing.

**Residual risk:** These controls reduce attack surface but do not prove kernel isolation or eliminate vulnerabilities in the host kernel, Docker daemon, image, or service. The writable workspace is deliberately mounted into the container. Review image provenance, patching, mount permissions, symlink races, and daemon security.

### F-06 — Resource limits, request bounds, and cleanup are present but need adversarial verification
**Severity:** Medium / High  
**Status:** Implemented in code; edge-case assurance pending

The service limits command length, timeout, output, file count, and concurrent executions; it rejects requests when at capacity and removes run directories in a finalizer. The active-slot reservation occurs before the first await, avoiding a straightforward concurrent oversubscription race.

**Residual risk:** The request body limit is 32 MiB, and cleanup uses asynchronous removal. Test slow clients, aborted requests, oversized bodies, output-limit termination, daemon failures, process termination, and cleanup failures. Confirm the capacity value is validated as a positive bounded integer at startup.

### F-07 — CI distinguishes stub wiring tests from real Docker isolation tests
**Severity:** High  
**Status:** Pipeline added; successful run not established by this report

The workflow adds separate Compose structure/stub-wiring checks and a real-Docker isolation job. The real job explicitly fails if the isolation suite is skipped, builds the sandbox image, and runs tests against a live Docker daemon. This distinction is important: stub-engine checks must never be presented as proof of kernel/container isolation.

**Residual risk:** A workflow definition is not evidence of a successful workflow run. Verify the exact branch workflow run and inspect each job's logs before marking the branch green. Also verify dependency scanning, secret scanning, action pinning, and test coverage against the final workflow contents.

## Important repository hygiene issue

The branch removes `data/agentstation_relational_db.json` and `data/missions_store.json`. This avoids carrying data files forward in the branch, but deletion from the current tree does **not** remove sensitive data from Git history. If those files ever contained real personal data, credentials, or other secrets, treat this as a potential exposure: identify the affected commit/history, rotate exposed credentials, assess notification obligations, and plan history remediation separately. Do not rewrite shared history without explicit approval and a coordinated plan.

## Release gates

The following must be evidenced before production certification:

1. Real Docker isolation workflow passes without skips; retain logs and commit SHA.
2. Docker socket/daemon trust boundary receives an explicit architecture decision and threat-model sign-off.
3. PostgreSQL schema, RLS policies, database roles, and cross-tenant negative tests are independently verified.
4. All mission, file, approval, job, streaming, and admin endpoints are checked for authenticated ownership and tenant scoping.
5. Deployment proves a high-entropy shared token is present in both services and is not exposed to users or logs.
6. Secret and PII exposure in Git history is assessed; rotate any exposed credentials and remediate history if warranted.
7. CI passes on the exact proposed PR head, including typecheck/build, unit tests, Compose checks, and real Docker isolation.

## Evidence discipline

Use these labels in follow-up reporting:
- **VERIFIED:** supported by a successful test or inspected deployment evidence tied to a commit.
- **CODE PRESENT:** implementation exists, but runtime or deployment proof is absent.
- **NOT VERIFIED:** evidence is missing or test was skipped.
- **RESIDUAL RISK:** mitigation exists but the underlying risk remains.

No formal OWASP, NIST, CIS, or other compliance certification is claimed by this review.
