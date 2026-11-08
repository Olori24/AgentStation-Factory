-- One-time, session-bound GitHub App installation state.
-- Store only SHA-256 hashes; never persist the raw state or session cookie.
CREATE TABLE IF NOT EXISTS github_install_states (
  state_hash char(64) PRIMARY KEY,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  session_hash char(64) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE github_install_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_install_states FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS github_install_states_tenant_isolation ON github_install_states;
CREATE POLICY github_install_states_tenant_isolation
  ON github_install_states
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE INDEX IF NOT EXISTS github_install_states_expiry_idx
  ON github_install_states(expires_at);
