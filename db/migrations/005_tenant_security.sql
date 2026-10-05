-- Multi-tenant ownership and row-level security for durable company control-plane data.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_user_id text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id text;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS owner_user_id text;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS organization_id text;

CREATE INDEX IF NOT EXISTS companies_owner_idx ON companies(owner_user_id, organization_id);
CREATE INDEX IF NOT EXISTS missions_owner_idx ON missions(owner_user_id, organization_id);

-- Backfill legacy rows into the initial AgentStation organization.
UPDATE companies
SET owner_user_id = COALESCE(owner_user_id, 'user-bolaji-01'),
    organization_id = COALESCE(organization_id, 'org-station-01')
WHERE owner_user_id IS NULL OR organization_id IS NULL;

UPDATE missions m
SET owner_user_id = COALESCE(m.owner_user_id, c.owner_user_id, 'user-bolaji-01'),
    organization_id = COALESCE(m.organization_id, c.organization_id, 'org-station-01')
FROM companies c
WHERE m.company_id = c.id
  AND (m.owner_user_id IS NULL OR m.organization_id IS NULL);

ALTER TABLE companies ALTER COLUMN owner_user_id SET NOT NULL;
ALTER TABLE companies ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE missions ALTER COLUMN owner_user_id SET NOT NULL;
ALTER TABLE missions ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_tenant_isolation ON companies;
CREATE POLICY companies_tenant_isolation ON companies
USING (
  organization_id = current_setting('app.organization_id', true)
  AND (
    owner_user_id = current_setting('app.user_id', true)
    OR current_setting('app.role', true) = 'admin'
  )
)
WITH CHECK (
  organization_id = current_setting('app.organization_id', true)
  AND (
    owner_user_id = current_setting('app.user_id', true)
    OR current_setting('app.role', true) = 'admin'
  )
);

DROP POLICY IF EXISTS missions_tenant_isolation ON missions;
CREATE POLICY missions_tenant_isolation ON missions
USING (
  organization_id = current_setting('app.organization_id', true)
  AND (
    owner_user_id = current_setting('app.user_id', true)
    OR current_setting('app.role', true) = 'admin'
  )
)
WITH CHECK (
  organization_id = current_setting('app.organization_id', true)
  AND (
    owner_user_id = current_setting('app.user_id', true)
    OR current_setting('app.role', true) = 'admin'
  )
);
