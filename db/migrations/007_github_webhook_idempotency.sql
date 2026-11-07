-- Durable GitHub webhook replay/idempotency ledger.
-- A unique delivery ID is the cross-instance atomic deduplication boundary.
CREATE TABLE IF NOT EXISTS github_webhook_deliveries (
  delivery_id text PRIMARY KEY,
  event_name text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS github_webhook_deliveries_received_idx
  ON github_webhook_deliveries(received_at);

REVOKE ALL ON TABLE github_webhook_deliveries FROM PUBLIC;
