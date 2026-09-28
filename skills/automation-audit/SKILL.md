---
name: Automation Audit
description: Analyze business workflows for repetitive work, failure points, automation opportunities, and safe human approval boundaries.
id: automation-audit
version: 1.0.0
capabilities: workflow_analysis,automation_design,risk_review
requiredInputs: businessType,workflowDescription,tools
outputs: opportunities,architecture,acceptanceTests
tools: workflow_tools
boundaries: preserve_human_approval,do_not_execute_destructive_actions
---
# Automation Audit
Map trigger, steps, handoffs, outputs, permissions, retries, rollback, and measurable impact. Prefer provider-neutral designs.
