import crypto from "crypto";

const DATABASE_URL = String(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || ""
).trim();
const STORAGE_BACKEND = String(
  process.env.AGENTSTATION_STORAGE || (process.env.NODE_ENV === "production" ? "postgres" : "json")
).trim().toLowerCase();
let sqlClient: any;
const developmentCounters = new Map<string, { count: number; resetAt: number }>();

async function getSql() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required for distributed auth rate limiting");
  if (!sqlClient) {
    const neon = await import("@neondatabase/serverless");
    sqlClient = neon.neon(DATABASE_URL);
  }
  return sqlClient;
}

/** Distributed fixed-window limiter. Production decisions are atomic in PostgreSQL. */
export async function allowAuthAttempt(clientAddress: string, route: string, limit = 10): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60_000;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const secret = String(process.env.SESSION_SECRET || "local-development-only").trim();
  const keyHash = crypto.createHmac("sha256", secret)
    .update(`${clientAddress.slice(0, 128)}:${route.slice(0, 64)}`)
    .digest("hex");

  if (process.env.NODE_ENV === "production" && STORAGE_BACKEND !== "postgres") {
    throw new Error("Distributed auth rate limiting requires PostgreSQL storage");
  }

  if (STORAGE_BACKEND === "postgres") {
    const sql = await getSql();
    const rows = await sql`
      INSERT INTO auth_rate_limits (key_hash, window_start, request_count)
      VALUES (${keyHash}, to_timestamp(${windowStartMs / 1000}), 1)
      ON CONFLICT (key_hash, window_start)
      DO UPDATE SET request_count = auth_rate_limits.request_count + 1
      RETURNING request_count
    `;
    return Number(rows?.[0]?.request_count || 0) <= limit;
  }

  const key = `${keyHash}:${windowStartMs}`;
  for (const [storedKey, value] of developmentCounters) {
    if (value.resetAt <= now) developmentCounters.delete(storedKey);
  }
  const current = developmentCounters.get(key) || { count: 0, resetAt: windowStartMs + windowMs };
  current.count += 1;
  developmentCounters.set(key, current);
  return current.count <= limit;
}
