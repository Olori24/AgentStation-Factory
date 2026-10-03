export type SimulationRequest = {
  objective: string;
  seedText: string;
  scenarioCount?: number;
  iterations?: number;
  context?: Record<string, unknown>;
};

export type SimulationResult = {
  provider: "mirofish";
  simulated: true;
  result: Record<string, unknown>;
};

const MAX_SEED_LENGTH = 20_000;
const MAX_OBJECTIVE_LENGTH = 2_000;
const MAX_SCENARIOS = 10;
const MAX_ITERATIONS = 100;
const TIMEOUT_MS = 60_000;

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

/**
 * Calls an explicitly configured AgentStation-compatible MiroFish gateway.
 * This intentionally does not guess MiroFish's internal/native API routes.
 * Gateway contract: POST JSON { objective, seedText, scenarioCount, iterations, context }
 * and return a JSON object containing the provider's report/results.
 */
export async function runMiroFishSimulation(input: SimulationRequest): Promise<SimulationResult> {
  const endpoint = (process.env.MIROFISH_ADAPTER_URL || "").trim();
  if (!endpoint) throw new Error("Simulation provider unavailable: MIROFISH_ADAPTER_URL is not configured");

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Invalid MIROFISH_ADAPTER_URL: expected an absolute HTTP(S) URL");
  }
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost && process.env.NODE_ENV !== "production")) {
    throw new Error("MIROFISH_ADAPTER_URL must use HTTPS (HTTP is allowed only for local development)");
  }
  if (!input || typeof input.objective !== "string" || !input.objective.trim() ||
      typeof input.seedText !== "string" || !input.seedText.trim()) {
    throw new Error("objective and seedText are required");
  }
  if (input.objective.length > MAX_OBJECTIVE_LENGTH || input.seedText.length > MAX_SEED_LENGTH) {
    throw new Error("Simulation input exceeds the configured size limit");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const token = (process.env.MIROFISH_ADAPTER_TOKEN || "").trim();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        objective: input.objective.trim(),
        seedText: input.seedText,
        scenarioCount: boundedInteger(input.scenarioCount, 3, 1, MAX_SCENARIOS),
        iterations: boundedInteger(input.iterations, 20, 1, MAX_ITERATIONS),
        context: input.context && typeof input.context === "object" && !Array.isArray(input.context)
          ? input.context
          : {},
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Simulation gateway returned HTTP ${response.status}`);
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Simulation gateway returned an invalid JSON object");
    }
    return { provider: "mirofish", simulated: true, result: result as Record<string, unknown> };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Simulation gateway timed out after 60 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
