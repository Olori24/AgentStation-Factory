import crypto from "crypto";
import { agentRouterChat } from "./agentRouter";
import type { AgentTask } from "./multiAgent";
import { instantiateObjectiveTemplate } from "./objectiveTemplates";

type Sql = { query: <T = any>(text: string, params?: any[]) => Promise<T[]> };
let sql: Sql | null = null;
let initialized = false;

async function getSql(): Promise<Sql | null> {
  if (initialized) return sql;
  initialized = true;
  const url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || "").trim();
  if (!url) return null;
  try {
    const m = await import("@neondatabase/serverless");
    sql = m.neon(url) as unknown as Sql;
    return sql;
  } catch (error) {
    console.warn("[DURABLE-MULTI-AGENT] Neon unavailable:", (error as Error).message);
    return null;
  }
}

const MAX_TASKS = 8;
const MAX_WORKERS = Number(process.env.MULTI_AGENT_MAX_CONCURRENCY || 4);
const TIMEOUT_MS = Number(process.env.MULTI_AGENT_TIMEOUT_MS || 45000);
const STALE_MS = Math.max(TIMEOUT_MS * 2, 90000);

function taskFromRow(row: any): AgentTask {
  return {
    id: String(row.id),
    missionId: row.mission_id || undefined,
    agentId: String(row.agent_id),
    objective: String(row.objective),
    status: row.status,
    result: row.result ?? undefined,
    error: row.error || undefined,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    finishedAt: row.finished_at ? new Date(row.finished_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listDurableAgents() {
  const db = await getSql();
  if (!db) return null;
  return db.query("SELECT * FROM agent_registry WHERE enabled=true ORDER BY id");
}

export async function listDurableTasks(missionId?: string) {
  const db = await getSql();
  if (!db) return null;
  const rows = missionId
    ? await db.query("SELECT * FROM agent_tasks WHERE mission_id=$1 ORDER BY created_at DESC LIMIT 100", [missionId])
    : await db.query("SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 100");
  return rows.map(taskFromRow);
}

export async function enqueueDurableAgents(input: {
  missionId?: string;
  tasks?: Array<{ agentId: string; objective: string; skillIds?: string[] }>;
  templateId?: string;
  variables?: Record<string, unknown>;
}) {
  const expanded = input.templateId
    ? instantiateObjectiveTemplate(String(input.templateId), input.variables || {})
    : null;
  const tasks = expanded?.tasks || input.tasks || [];
  if (!Array.isArray(tasks) || tasks.length === 0) throw new Error("tasks must contain at least one agent task");
  if (tasks.length > MAX_TASKS) throw new Error("maximum 8 parallel agents per dispatch");

  const db = await getSql();
  if (!db) return null;

  const agents = await db.query(
    "SELECT id, enabled FROM agent_registry WHERE id = ANY($1::text[])",
    [tasks.map(t => t.agentId)],
  );
  const available = new Set(agents.filter((a: any) => a.enabled).map((a: any) => String(a.id)));
  for (const task of tasks) {
    if (!available.has(task.agentId)) throw new Error("Agent unavailable: " + task.agentId);
    if (!String(task.objective || "").trim()) throw new Error("Objective required for " + task.agentId);
  }

  const objectiveRunId = "objective-run-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
  const outcome = expanded?.outcome || "Execute the supplied agent task set and record evidence.";
  await db.query(
    "INSERT INTO objective_runs (id,template_id,mission_id,status,input,outcome) VALUES ($1,$2,$3,'queued',$4::jsonb,$5)",
    [objectiveRunId, expanded?.templateId || "custom-dispatch", input.missionId || null, JSON.stringify(input.variables || {}), outcome],
  );

  const created: AgentTask[] = [];
  try {
    for (const task of tasks) {
      const id = "agent-task-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
      const rows = await db.query(
        "INSERT INTO agent_tasks (id,mission_id,objective_run_id,agent_id,objective,skill_ids,status,created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,'queued',now()) RETURNING *",
        [id, input.missionId || null, objectiveRunId, task.agentId, String(task.objective).trim(), JSON.stringify(task.skillIds || [])],
      );
      created.push(taskFromRow(rows[0]));
    }
    await db.query("UPDATE objective_runs SET status='running',updated_at=now() WHERE id=$1", [objectiveRunId]);
  } catch (error) {
    await db.query(
      "UPDATE objective_runs SET status='failed',outcome=$2,updated_at=now(),completed_at=now() WHERE id=$1",
      [objectiveRunId, error instanceof Error ? error.message : String(error)],
    );
    throw error;
  }

  return {
    objectiveRunId,
    count: created.length,
    queued: created.length,
    completed: 0,
    failed: 0,
    tasks: created,
    objective: expanded
      ? { templateId: expanded.templateId, name: expanded.name, outcome: expanded.outcome }
      : { templateId: "custom-dispatch", name: "Custom Agent Dispatch", outcome },
  };
}

async function execute(agent: any, task: AgentTask) {
  try {
    const result = await Promise.race([
      agentRouterChat({ model: agent.model || undefined, system: agent.system_prompt, user: task.objective }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Multi-agent execution timeout")), TIMEOUT_MS)),
    ]);
    return {
      status: "completed" as const,
      result: { text: result.text, provider: result.provider, model: result.model, requestId: result.requestId },
    };
  } catch (error) {
    return { status: "failed" as const, error: error instanceof Error ? error.message : String(error) };
  }
}

async function refreshObjectiveRun(db: Sql, objectiveRunId: string) {
  const rows = await db.query(
    "SELECT status, COUNT(*)::int AS count FROM agent_tasks WHERE objective_run_id=$1 GROUP BY status",
    [objectiveRunId],
  );
  const counts = new Map(rows.map((r: any) => [String(r.status), Number(r.count)]));
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const completed = counts.get("completed") || 0;
  const failed = counts.get("failed") || 0;
  const running = counts.get("running") || 0;
  const queued = counts.get("queued") || 0;
  const status = total > 0 && completed + failed === total ? (failed > 0 ? "failed" : "completed") : "running";
  await db.query(
    "UPDATE objective_runs SET status=$2,updated_at=now(),completed_at=CASE WHEN $2 IN ('completed','failed') THEN now() ELSE completed_at END WHERE id=$1",
    [objectiveRunId, status],
  );
  return { status, total, queued, running, completed, failed };
}

export async function processDurableAgents(maxWorkers = MAX_WORKERS) {
  const db = await getSql();
  if (!db) return { durable: false, claimed: 0, completed: 0, failed: 0 };

  const limit = Math.max(1, Math.min(8, Number(maxWorkers || 4)));
  await db.query(
    "UPDATE agent_tasks SET status='queued',started_at=NULL,error=COALESCE(error,'Recovered after worker timeout') WHERE status='running' AND started_at IS NOT NULL AND started_at < now() - ($1 || ' seconds')::interval",
    [Math.ceil(STALE_MS / 1000)],
  );

  const claimed: AgentTask[] = [];
  for (let i = 0; i < limit; i++) {
    const rows = await db.query(
      "UPDATE agent_tasks t SET status='running',started_at=now(),error=NULL WHERE t.id=(SELECT c.id FROM agent_tasks c JOIN agent_registry r ON r.id=c.agent_id WHERE c.status='queued' AND r.enabled=true AND NOT EXISTS (SELECT 1 FROM agent_tasks a WHERE a.agent_id=c.agent_id AND a.status='running' GROUP BY a.agent_id HAVING COUNT(*)>=r.max_concurrency) ORDER BY c.created_at LIMIT 1) RETURNING t.*",
    );
    if (!rows.length) break;
    claimed.push(taskFromRow(rows[0]));
  }

  let completed = 0;
  let failed = 0;
  await Promise.all(claimed.map(async task => {
    const rows = await db.query("SELECT * FROM agent_registry WHERE id=$1 AND enabled=true", [task.agentId]);
    if (!rows.length) {
      failed++;
      await db.query("UPDATE agent_tasks SET status='failed',error='Agent definition unavailable',finished_at=now() WHERE id=$1 AND status='running'", [task.id]);
      return;
    }
    const out = await execute(rows[0], task);
    if (out.status === "completed") completed++; else failed++;
    await db.query(
      "UPDATE agent_tasks SET status=$1,result=$2::jsonb,error=$3,finished_at=now() WHERE id=$4 AND status='running'",
      [out.status, out.result ? JSON.stringify(out.result) : null, out.error || null, task.id],
    );
    const runRows = await db.query("SELECT objective_run_id FROM agent_tasks WHERE id=$1", [task.id]);
    const objectiveRunId = runRows[0]?.objective_run_id;
    if (objectiveRunId) await refreshObjectiveRun(db, String(objectiveRunId));
  }));

  return { durable: true, claimed: claimed.length, completed, failed };
}
