import crypto from "crypto";

const DATABASE_URL = String(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || ""
).trim();
const STORAGE_BACKEND = String(
  process.env.AGENTSTATION_STORAGE || (process.env.NODE_ENV === "production" ? "postgres" : "json")
).trim().toLowerCase();
let sqlClient: any;
const developmentDeliveries = new Map<string, number>();

/**
 * Atomically claims a GitHub delivery ID. PostgreSQL's unique constraint is
 * the concurrency boundary across serverless instances; process memory is
 * used only for local development and is never accepted in production.
 */
export async function claimWebhookDelivery(deliveryId: string, eventName: string): Promise<boolean> {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(deliveryId)) {
    throw new Error("Invalid GitHub delivery identifier");
  }

  if (process.env.NODE_ENV === "production" && STORAGE_BACKEND !== "postgres") {
    throw new Error("Durable webhook idempotency requires PostgreSQL storage");
  }

  if (STORAGE_BACKEND === "postgres") {
    if (!DATABASE_URL) throw new Error("DATABASE_URL is required for webhook idempotency");
    if (!sqlClient) {
      const neon = await import("@neondatabase/serverless");
      sqlClient = neon.neon(DATABASE_URL);
    }
    const rows = await sqlClient`
      INSERT INTO github_webhook_deliveries (delivery_id, event_name)
      VALUES (${deliveryId}, ${eventName})
      ON CONFLICT (delivery_id) DO NOTHING
      RETURNING delivery_id
    `;
    return Array.isArray(rows) && rows.length === 1;
  }

  const now = Date.now();
  for (const [id, createdAt] of developmentDeliveries) {
    if (now - createdAt > 24 * 60 * 60 * 1000) developmentDeliveries.delete(id);
  }
  if (developmentDeliveries.has(deliveryId)) return false;
  developmentDeliveries.set(deliveryId, now);
  return true;
}
