create table if not exists objective_runs (
  id text primary key,
  template_id text not null,
  mission_id text,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  input jsonb not null default '{}'::jsonb,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists objective_runs_template_idx on objective_runs (template_id, created_at);
create index if not exists objective_runs_mission_idx on objective_runs (mission_id, created_at);
create index if not exists objective_runs_status_idx on objective_runs (status, updated_at);

alter table if exists agent_tasks
  add column if not exists objective_run_id text;
create index if not exists agent_tasks_objective_run_idx
  on agent_tasks (objective_run_id, created_at);
