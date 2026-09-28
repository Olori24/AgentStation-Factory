# MiroFish Simulation Provider

AgentStation exposes an opt-in simulation endpoint at `POST /api/simulations/mirofish`.
The endpoint is authenticated by the application's existing API middleware.

## Important compatibility note

MiroFish is a separate Python/Node application. AgentStation does **not** assume that its internal API is a stable public integration contract. `MIROFISH_ADAPTER_URL` must point to an AgentStation-compatible gateway you operate that translates the request below into the installed MiroFish version's supported workflow. Do not point it at a guessed native MiroFish route.

## Configuration

- `MIROFISH_ADAPTER_URL`: absolute HTTPS URL for the gateway (required to run; no default).
- `MIROFISH_ADAPTER_TOKEN`: optional bearer token sent to the gateway. Store it as a server-side secret; never expose it to a browser.

The adapter uses a 60-second request timeout and bounds `scenarioCount` to 1–10 and `iterations` to 1–100. Seed text is limited to 20,000 characters and objective text to 2,000 characters.

## Request

```json
{
  "objective": "Explore customer response to three service bundles",
  "seedText": "Source material and assumptions for the simulation",
  "scenarioCount": 3,
  "iterations": 20,
  "context": {
    "market": "Nigeria",
    "horizon": "90 days"
  }
}
```

## Gateway contract

The gateway accepts a JSON POST with `objective`, `seedText`, `scenarioCount`, `iterations`, and `context`. It must return a JSON object containing its report/results. AgentStation wraps that payload as `{ "provider": "mirofish", "simulated": true, "result": ... }`.

An unset provider returns HTTP 503. Gateway errors or invalid responses return an error response; they are not replaced with fabricated results.

## Governance

Simulation output is hypothetical, not empirical evidence or a guaranteed forecast. Preserve assumptions, limitations, and uncertainty in downstream reports. Require human review before consequential actions. Do not use simulation alone to authorize spending, outreach, production changes, or decisions affecting rights, safety, access, or eligibility.

## Licensing

MiroFish's upstream repository identifies its license as AGPL-3.0. Review the full license and obtain appropriate legal guidance before redistributing a modified or integrated MiroFish service. Keeping it as a separately operated service does not automatically resolve every licensing obligation.
