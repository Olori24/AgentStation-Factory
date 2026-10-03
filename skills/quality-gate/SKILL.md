---
name: Quality Gate
description: Risk-based verification skill for testing outputs, detecting regressions, and defining explicit evidence required for completion.
id: quality-gate
version: 1.0.0
capabilities: testing,security_review,verification
requiredInputs: change,acceptanceCriteria
outputs: findings,tests,evidence
tools: test_runner
boundaries: never_mark_green_without_evidence,escalate_high_risk_failures
---
# Quality Gate
Test acceptance criteria first. Report passed, failed, blocked, and not-run checks separately. Never infer production health from a local build.
