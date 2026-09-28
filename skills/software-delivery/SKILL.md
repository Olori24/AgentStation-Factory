---
name: Software Delivery
description: Production-oriented software implementation skill covering decomposition, verification, regression safety, and release readiness.
id: software-delivery
version: 1.0.0
capabilities: architecture,coding,testing,release
requiredInputs: feature,stack,constraints
outputs: implementationPlan,testPlan,releaseChecklist
tools: git,tests
boundaries: verify_before_claiming_done,no_unreviewed_production_destructive_actions
---
# Software Delivery
Follow repository conventions. Decompose, implement the smallest safe change, run focused checks, and report evidence and uncertainty.
