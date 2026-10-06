-- Durable AgentStation state store.
-- This table replaces local JSON persistence in production.
CREATE TABLE IF NOT EXISTS agentstation_state (
  organization_id text PRIMARY KEY,
  version integer NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agentstation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentstation_state FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agentstation_state_tenant_isolation ON agentstation_state;
CREATE POLICY agentstation_state_tenant_isolation
  ON agentstation_state
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE INDEX IF NOT EXISTS agentstation_state_updated_idx
  ON agentstation_state(updated_at DESC);
