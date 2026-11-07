-- Shared fixed-window counters for signup/login abuse protection.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key_hash text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 1),
  PRIMARY KEY (key_hash, window_start)
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_window_idx
  ON auth_rate_limits(window_start);

REVOKE ALL ON TABLE auth_rate_limits FROM PUBLIC;
