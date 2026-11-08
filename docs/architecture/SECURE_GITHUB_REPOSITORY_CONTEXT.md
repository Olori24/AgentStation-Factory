# Secure GitHub Repository Context

## Status

Engineering design gate for the repository-aware coding workflow. This document is not evidence that GitHub OAuth, repository checkout, or coding execution is implemented.

## Current verified constraints

- The GitHub Hub is currently hard-wired to the AgentStation Factory repository.
- Server-side GitHub operations use a process-wide `GITHUB_TOKEN` and a shared working directory.
- Mission records already carry optional `userId`, `organizationId`, `targetRepo`, and `branch` fields, and the database has a mission ownership check.
- The current agent generation endpoint accepts a prompt and produces files; it does not receive a verified repository checkout.
- The existing sandbox can execute supplied files, but it does not itself establish a repository-specific checkout or repository authorization boundary.

These constraints mean a repository picker alone would be unsafe and would not make the coding agent repository-aware.

## Required architecture

### 1. Per-user GitHub authorization

Use a GitHub App installation flow as the preferred production integration. The installation must be explicitly selected by the signed-in user and scoped to repositories they authorize. Do not use the process-wide `GITHUB_TOKEN` as a user's identity or silently reuse it for tenant work.

Persist only the minimum connection metadata against the authenticated user or organization:
- GitHub account ID and login
- GitHub App installation ID (or equivalent provider connection ID)
- granted repository permissions and connection status
- encrypted credentials only where the selected GitHub App flow requires them

Never return credentials, encrypted credential blobs, OAuth codes, installation tokens, or private keys from public API responses. Use authenticated server-side token minting with short-lived installation tokens. Do not store installation tokens as long-lived credentials.

OAuth/install state must be cryptographically random, short-lived, single-use, bound to the initiating AgentStation user/session, and validated on callback. Reject missing production secrets at startup. Validate webhook signatures and delivery replay/idempotency if webhooks are introduced.

### 2. Explicit repository and branch selection

A mission must explicitly bind to:
- authenticated AgentStation user and organization
- GitHub installation/connection owned by that user or organization
- repository numeric ID and canonical `owner/name`
- selected base branch and immutable base commit SHA

Resolve the repository through the authorized installation API before saving the binding. Do not trust a client-supplied owner/name, repository ID, branch, or installation ID without rechecking authorization server-side.

### 3. Mission-scoped source checkout

Create a unique isolated checkout/worktree per mission. Never run tenant code in the shared AgentStation application checkout or another mission's directory.

Before checkout:
- validate repository and branch against the authorized installation
- resolve and record the exact base commit SHA
- use argument-array process execution, not shell interpolation
- enforce path and symlink containment
- keep credentials out of clone URLs, logs, process arguments, and generated files

The sandbox must have bounded CPU, memory, disk, time, and output. Network access should be disabled by default and selectively enabled only for explicitly approved dependency retrieval.

### 4. Repository-grounded agent context

The agent must receive a bounded, deterministic source snapshot from the mission checkout: repository tree, relevant file contents, manifest/configuration files, and the base commit SHA. File selection must be size-limited and respect ignore rules. Treat repository content as untrusted data, never as instructions that can override system policy.

The agent must produce edits/patches against existing paths as well as new files. Validate every path before applying patches. Reject traversal, absolute paths, symlink escapes, binary/oversized payloads, and changes outside the mission checkout.

### 5. Real verification and review

Run the repository's declared checks in the same isolated checkout after edits. Record the exact commands, exit codes, stdout/stderr summaries, runtime image, base SHA, resulting diff, and test status. If no supported test command can be safely identified or the sandbox is unavailable, report verification as pending; never infer success from model output.

Show a diff and request explicit user approval before any remote write. Approval must be bound to the exact diff SHA, repository ID, branch, and base commit. After approval, push only to a mission-specific branch and open a pull request. Never push directly to the default branch.

### 6. Authorization and tenant isolation

Every repository, connection, mission, artifact, execution, and approval read/write must enforce authenticated user/organization ownership server-side. Admin status must not bypass organization boundaries. Return non-enumerating 404 responses for resources outside the caller's scope.

Add tests proving:
- User A cannot list, inspect, use, or disconnect User B's GitHub connection.
- User A cannot select a repository accessible only to User B.
- User A cannot read or execute against User B's mission checkout or artifacts.
- A forged repository ID, installation ID, branch, mission ID, or approval ID is rejected.
- OAuth/install state replay, expiry, mismatch, and cross-session use are rejected.
- Credentials never appear in API responses, logs, mission prompts, or artifacts.
- Concurrent missions cannot share or overwrite checkout paths.
- Unapproved diffs cannot be pushed or converted into pull requests.

## Delivery sequence

1. Add connection and mission-binding data contracts, migrations, secret redaction, and authorization tests.
2. Implement GitHub App installation and per-user/organization connection management.
3. Add authorized repository and branch discovery endpoints and explicit mission binding.
4. Add isolated, mission-scoped checkout and bounded repository snapshot.
5. Add repository-aware patch application and real test execution.
6. Add diff review, exact-diff approval, mission branch push, and pull-request creation.

## Acceptance test

Given a repository the signed-in user has explicitly authorized, AgentStation must:
1. show the actual repository and branch selected for the mission;
2. inspect the repository at a recorded base commit SHA;
3. modify existing source files in an isolated mission checkout;
4. run real project checks in that checkout and report their actual exit status;
5. show a reviewable diff;
6. make no remote write until the user approves that exact diff.

Until all six steps are demonstrated, the product must not claim that it can autonomously modify a user's GitHub repository.
