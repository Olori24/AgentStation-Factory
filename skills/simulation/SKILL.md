---
id: simulation
name: Scenario Simulation
description: Rehearse bounded what-if scenarios using a configured simulation provider; distinguish simulated outputs from real-world forecasts.
version: 1.0.0
capabilities: scenario-design, agent-based-simulation, sensitivity-analysis, uncertainty-reporting
requiredInputs: objective, seedText
outputs: scenario-results, assumptions, uncertainty, evidence
tools: configured-simulation-provider
boundaries: simulation-is-not-fact, no-autonomous-high-impact-decisions, human-review-required
---

# Scenario Simulation Skill

Use this skill to explore plausible outcomes in a sandbox, not to claim certainty or predict a guaranteed future.

## Procedure
1. Clarify the decision question, target population, time horizon, and observable outcome.
2. Record seed material, assumptions, known evidence, and important unknowns separately.
3. Define multiple meaningfully different scenarios and the variables that distinguish them.
4. Use only a configured simulation provider. AgentStation's MiroFish adapter is an opt-in HTTP gateway contract; it does not assume that MiroFish exposes a compatible native API.
5. Report the provider, run settings, scenario assumptions, returned results, limitations, and uncertainty.
6. Compare scenarios against predeclared measures. Do not turn simulated agent opinions into empirical evidence.
7. Require human review before consequential actions. Never autonomously spend money, contact people, change production systems, or make decisions affecting rights, access, safety, or eligibility based only on simulation output.

## Quality requirements
- Label all outputs as simulated.
- Do not fabricate runs, metrics, citations, or confidence levels.
- Separate source-backed facts from model-generated behavior and analyst interpretation.
- If no provider is configured, return a clear unavailable status and provide a simulation plan instead of inventing results.
