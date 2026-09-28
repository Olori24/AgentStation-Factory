-- Durable multi-agent runtime hardening.
-- These fields prepare explicit lease/retry accounting for the task ledger.
alter table if exists agent_tasks
  add column if not exists attempt integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists lease_id text,
  add column if not exists lease_expires_at timestamptz;

create index if not exists agent_tasks_lease_idx on agent_tasks (status, lease_expires_at, created_at);
