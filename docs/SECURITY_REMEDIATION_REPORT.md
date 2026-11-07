# AgentStation Factory — Security Remediation Report

**Branch:** `security/audit-remediation-2026-11-07`  
**Base commit:** `df1d24e91c8d0fd9a14da7ab33e1fbd437faabc7`  
**Report date:** 2026-11-07  
**Status:** Remediation changes committed to branch; runtime certification and production approval remain open.

## 1. Summary

This report records the security-related changes visible in the branch diff. It distinguishes code changes from evidence that can only be established by running the workflow or testing a deployed environment.

The branch is two commits ahead of the stated base at the time this report was prepared. The report documents the changes; it does not claim that the GitHub Actions workflow has passed or that production is certified.

## 2. Changes recorded in the branch

| Area | Files | Change recorded |
|---|---|---|
| Sandbox service | `sandbox/server.mjs` | Mandatory shared-token startup check, constant-time token comparison, request validation, capacity reservation, bounded timeout/output, hardened disposable container flags, path/symlink checks, health readiness behavior, cleanup |
| App sandbox dispatch | `server/sandbox.ts` | Runtime selection, production execution guards, remote sandbox dispatch, scrubbed environment for local/Docker execution, command and timeout bounds |
| Mission data | `server/db.ts` | Production PostgreSQL requirement, database URL guard, organization-scoped state persistence, explicit flush support, mission access helpers |
| Mission streaming | `server/streaming.ts` | Mission event authorization/scoping changes |
| Compose | `docker-compose.yml`, `.env.compose.example` | Dedicated sandbox service, required shared token interpolation, app service without Docker socket, sandbox service engine access, run-root wiring |
| CI | `.github/workflows/ci.yml` | Separate structural/stub Compose validation and real Docker isolation job; pinned action references visible in workflow |
| Tests | `tests/streaming_isolation.ts`, `tests/test_docker_isolation.py`, `tests/validate_compose.py` | Tenant-scoped streaming behavior, real-daemon isolation assertions, Compose structure/wiring checks |
| Repository hygiene | `.gitignore`, `data/agentstation_relational_db.json`, `data/missions_store.json` | Ignore rules updated and tracked data files removed from the current branch tree |

## 3. Security controls and their evidence status

| Control | Status | Evidence / limitation |
|---|---|---|
| Sandbox service refuses empty/short token | CODE PRESENT | Startup guard in `sandbox/server.mjs`; deployment secret not inspected |
| Constant-time token comparison | CODE PRESENT | Equal-length check followed by `timingSafeEqual` |
| App service has no Docker socket mount | CODE PRESENT | Compose validator asserts this |
| Dedicated sandbox service owns Docker socket | CODE PRESENT / RESIDUAL RISK | Narrows daemon access but retains a high-impact host trust boundary |
| Disposable container restrictions | CODE PRESENT | Docker arguments include no network, read-only root, no capabilities, non-root UID, resource limits |
| File path and symlink checks | CODE PRESENT | Implemented before materializing run files; race resistance still requires adversarial testing |
| Mission SSE tenant isolation | TEST ADDED | Test covers owner, another organization, anonymous client, and global heartbeat; broader API routes remain unverified |
| Production PostgreSQL-only startup | CODE PRESENT | Startup guards exist; deployed DB schema and RLS not independently inspected |
| Compose wiring | TEST ADDED | Static validator and stub-engine workflow are not proof of live Docker isolation |
| Real Docker isolation | NOT VERIFIED BY THIS REPORT | Requires successful non-skipped workflow run and log review |
| Git history PII/secret exposure | NOT VERIFIED | Removing files from current tree does not erase prior commits |

## 4. Tests and workflow interpretation

The branch adds or updates:
- `tests/streaming_isolation.ts` for mission event authorization.
- `tests/validate_compose.py` for Compose graph, required secret interpolation, mount wiring, and Dockerfile structure.
- `tests/test_docker_isolation.py` for live Docker checks including network isolation, read-only root filesystem, non-root identity, capabilities, timeout cleanup, workspace cleanup, memory, and PID limits.
- CI jobs that distinguish stub Compose wiring from real Docker isolation.

**Execution results:** This report does not have a verified GitHub Actions run ID or job logs. Therefore it intentionally does not state that these tests passed. A local or stubbed test run must not be substituted for the real Docker isolation job.

## 5. Outstanding risks and required actions

### R-01 — Docker daemon socket
The dedicated sandbox service still has Docker daemon access. Treat compromise of this service as a potential host compromise until a more constrained broker or isolated daemon/VM architecture is adopted and validated.

### R-02 — Database tenant isolation
Inspect the actual production schema and RLS policies, database grants, and transaction/session behavior. Add negative tests proving one organization cannot read or mutate another organization's missions, files, approvals, logs, jobs, and settings. The fixed default organization ID visible in the state persistence code requires particular scrutiny before claiming multi-tenant support.

### R-03 — App/service token deployment
Verify both services receive the same strong random token from a secret manager or protected deployment environment. Verify the token is not included in client bundles, logs, build artifacts, or repository files. Plan rotation.

### R-04 — Git history data exposure
The two JSON data files are deleted from the branch tree, but their historical blobs may remain accessible. Determine whether they contained personal data or secrets. Rotate any exposed credentials and follow the appropriate incident-response process. History rewriting is a separate coordinated operation and is not performed by this branch.

### R-05 — Runtime test evidence
Run the complete CI workflow on the final PR head. The real Docker job must execute without skips. Review logs and retain the workflow URL/run ID with the release evidence.

### R-06 — Broader authorization coverage
Review every API handler and websocket/SSE entry point. Verify authentication, ownership, organization scoping, and server-side admin authorization at the point of access. The focused streaming test is not comprehensive authorization certification.

## 6. Release decision

**Current decision: NOT CERTIFIED FOR PRODUCTION.**

The branch contains meaningful defense-in-depth improvements, but the following gates remain open:
- successful real-Docker isolation workflow on the final branch head;
- explicit acceptance or redesign of the Docker socket trust boundary;
- independent database RLS and cross-tenant verification;
- review of all authenticated API and admin paths;
- Git history PII/secret assessment;
- deployment verification of shared-secret provisioning.

A reviewer may inspect and test this branch through a pull request. Do not merge or deploy solely on the basis of these reports. Reassess the release decision only after the outstanding gates have evidence tied to the exact release commit.


## Follow-up CI remediation (2026-11-07)

The first PR workflow exposed two additional CI defects. Both have been addressed on this branch:

- Added `tests/test_security_adversarial.py`. It verifies fail-closed sandbox-service startup when the shared token is missing or shorter than 16 characters, constant-time token comparison, request/command/output/time limits, concurrency reservation, traversal and symlink defenses, cleanup, restrictive Docker flags, and the app-side environment allowlist.
- Corrected the adversarial job description so it does not claim these source-level/startup checks certify kernel isolation. The real Docker job remains the only kernel/container isolation certification.
- Updated Express to 4.22.3, Vite to 6.4.5, and pinned the transitive body-parser and qs overrides to 1.20.9 and 6.16.1.
- Regenerated `package-lock.json` using npm on a GitHub-hosted runner. The lockfile refresh job completed successfully; `npm ci` completed and both the production audit and full dependency audit reported **0 vulnerabilities**.

The full AgentStation CI workflow for the latest PR head is still running/pending at the time of this report update. Therefore the new adversarial suite, full build/test matrix, and real Docker isolation job are **not yet recorded as passing on the latest head**. Do not treat the dependency audit success as full CI certification.
