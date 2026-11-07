# Tenant Isolation Remediation Plan

**Assessment date:** 2026-11-07  
**Target branch:** `security/audit-remediation-2026-11-07`  
**Status:** Blocking architecture remediation; no production certification.

## Verified current design

The current PostgreSQL persistence path is a serialized application snapshot, not a relational multi-tenant data model:

- `server/db.ts` defines `DEFAULT_ORG.id = 'org-station-01'`.
- Both `loadPostgresState()` and `persistPostgresState()` select/write the single `agentstation_state` row for that fixed organization ID.
- The complete `DatabaseSchema` object, including users, organizations, missions, files, approvals, logs, settings and jobs, is serialized into that one JSONB value.
- Signup creates a fresh organization ID for each new account, then appends the organization and user to the shared in-memory object. The subsequent PostgreSQL flush still writes the whole snapshot under `org-station-01`.
- The RLS policy in migration 006 therefore scopes access to the single shared snapshot row. It does not independently isolate each organization represented inside the JSONB document.
- Migrations 001–004 create autonomy, agent registry/task, company and mission tables without tenant ownership columns or tenant RLS policies. Migration 006 only enables RLS on `agentstation_state`.
- The app performs selected ownership checks in memory (for example `canAccessMission`), but those checks are not a substitute for database-enforced tenant boundaries across every record and route.

**Conclusion:** the existing state-store RLS policy is not proof of tenant isolation. Treat the current design as a single shared application data store with application-level filters. Do not claim database-enforced multi-tenant isolation.

## Additional signup integrity finding

The signup handler checks `db.getUserByEmail(email)`, then separately appends an organization and user to in-memory arrays before flushing. No database unique constraint for normalized user email is established by the reviewed migrations, and the check/insert sequence is not atomic across concurrent requests or application instances.

The distributed IP/route limiter reduces request volume but does not enforce unique identity creation. A failed persistence attempt can also occur after the in-memory arrays have already been mutated.

**Required control:** create the user and organization in one database transaction with a database-enforced unique normalized email constraint. Handle uniqueness conflicts as HTTP 409. Do not issue a session until the transaction commits.

## Required target architecture

1. Replace the global JSONB snapshot as the production source of truth with normalized PostgreSQL tables for organizations, users, missions, subtasks, files, logs, approvals, executions, jobs, settings and other tenant-owned records.
2. Add a non-null `organization_id` to every tenant-owned table. Use foreign keys and, where needed, composite constraints that include `organization_id` so child records cannot reference a parent from another tenant.
3. Keep truly global reference/configuration tables separate and explicitly classify them as global; do not add permissive tenant policies to them by default.
4. Enable and FORCE RLS on every tenant-owned table. Policies must use a transaction-local tenant context set only after the server has authenticated the user and resolved their organization from trusted server-side records.
5. Run the application with a restricted database role that is not a superuser, does not have `BYPASSRLS`, and does not own the protected tables. Verify the effective role in staging.
6. Replace in-memory read/modify/write operations with parameterized SQL and transactional ownership predicates. Avoid fetching global arrays and filtering only after data reaches application memory.
7. Make signup, organization creation, email uniqueness, role assignment and initial membership atomic. Public signup must never be able to create an admin role.
8. Audit every API route and background worker for organization context propagation. Jobs, webhooks, SSE, WebSockets, files, approvals and child records must preserve the originating tenant.
9. Migrate existing snapshot data only after a deterministic mapping from every record to an organization and owner is established. Quarantine ambiguous/orphaned records; do not silently assign them to the default organization.
10. Retire the JSON snapshot read/write path only after reconciliation, parity checks, backup/restore validation and rollback planning.

## Required adversarial verification

- Tenant A cannot read, update, delete or infer Tenant B's users, missions, files, logs, approvals, settings, tasks or jobs.
- A tenant cannot attach a child record to another tenant's parent by guessing its ID.
- Missing tenant context returns no rows / rejects writes; it must never fall back to a default organization.
- A forged client-supplied organization ID cannot change the server-resolved tenant context.
- An application role with ordinary runtime privileges cannot bypass RLS.
- Concurrent signup attempts for the same normalized email create exactly one account and one organization.
- A persistence failure creates neither a usable account nor a session.
- Background workers and webhook handlers cannot cross tenant boundaries through unscoped job or delivery IDs.
- Tests run against PostgreSQL using the same restricted role and policy configuration used by the application, not an owner or superuser.

## Release decision

**Production approval remains blocked.** Migrations 007 and 008 address webhook delivery deduplication and distributed authentication throttling, but they do not resolve the shared JSONB snapshot or establish tenant RLS across the schema.

Do not apply a blanket RLS migration that assigns every existing row to `org-station-01`. That would create a false appearance of isolation and could misclassify customer data. Do not merge this remediation branch or deploy a multi-tenant production workload until the normalized model, data migration, restricted database role, route audit and negative tests are complete.
