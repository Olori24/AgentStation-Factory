-- AgentStation durable autonomy schema
-- Apply to PostgreSQL/Neon only after reviewing environment and migration plan.

create table if not exists autonomy_goals (
  id text primary key,
  name text not null,
  objective text not null,
  interval_minutes integer not null check (interval_minutes >= 1),
  status text not null check (status in ('active','paused','completed','failed')),
  auto_approve_safe_tools boolean not null default true,
  provider text,
  model text,
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  last_job_id text,
  consecutive_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists autonomy_goals_due_idx
  on autonomy_goals (status, next_run_at);

create table if not exists autonomy_jobs (
  id text primary key,
  goal_id text references autonomy_goals(id) on delete set null,
  mission_id text,
  status text not null check (status in ('waiting','active','completed','failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  payload jsonb not null default '{}'::jsonb,
  lease_id text,
  lease_expires_at timestamptz,
  attempt integer not null default 0,
  max_attempts integer not null default 3,
  result jsonb,
  error text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists autonomy_jobs_claim_idx
  on autonomy_jobs (status, lease_expires_at, created_at);

create table if not exists autonomy_checkpoints (
  id bigserial primary key,
  job_id text not null references autonomy_jobs(id) on delete cascade,
  step_key text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(job_id, step_key)
);

create table if not exists autonomy_usage (
  id bigserial primary key,
  job_id text references autonomy_jobs(id) on delete set null,
  provider text not null,
  route text,
  request_units numeric,
  estimated_cost numeric,
  currency text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
