import crypto from "crypto";
import fs from "fs";
import path from "path";
import { agentRouterChat, isAgentRouterConfigured } from "./agentRouter";
import { processDurableAgents } from "./durableMultiAgent";

export type GoalStatus = "active" | "paused" | "completed" | "failed";
export interface AutonomousGoal {
  id: string; name: string; objective: string; intervalMinutes: number;
  status: GoalStatus; autoApproveSafeTools: boolean;
  provider?: "gemini" | "ollama" | "agentrouter"; model?: string;
  nextRunAt: string; lastRunAt?: string; lastJobId?: string;
  consecutiveFailures: number; createdAt: string; updatedAt: string;
}
type Sql = (strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>;
let sql: Sql | null = null;
let init = false;

async function getSql(): Promise<Sql | null> {
  if (init) return sql;
  init = true;
  const url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || "").trim();
  if (!url) return null;
  try {
    const m = await import("@neondatabase/serverless");
    sql = m.neon(url) as Sql;
    return sql;
  } catch (e) {
    console.warn("[AUTONOMY] Neon unavailable:", (e as Error).message);
    return null;
  }
}

const DATA_DIR = process.env.AGENTSTATION_DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "autonomy_goals.json");
const MAX_CONCURRENCY = Number(process.env.AUTONOMY_MAX_CONCURRENCY || 2);
const TIMEOUT_MS = Number(process.env.AUTONOMY_EXECUTION_TIMEOUT_MS || 45000);

class AutonomyScheduler {
  private goals: AutonomousGoal[] = [];
  private timer?: NodeJS.Timeout;
  private runningCount = 0;

  constructor() { this.load(); }

  private load() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(FILE)) {
        const parsed = JSON.parse(fs.readFileSync(FILE, "utf8"));
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.goals = parsed;
          return;
        }
      }
    } catch {}
    const now = new Date().toISOString();
    this.goals = [
      {
        id: "goal-leadgen-audit",
        name: "Daily Lead Funnel & Attribution Audit",
        objective: "Audit short-form campaign conversion metrics, lead qualification rates, and CRM pipeline sync.",
        intervalMinutes: 60,
        status: "active",
        autoApproveSafeTools: true,
        provider: "agentrouter",
        nextRunAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        consecutiveFailures: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "goal-security-sentinel",
        name: "Repository Security & Dependency Sentinel",
        objective: "Scan workspace dependencies, environment configurations, and API endpoints for security regressions.",
        intervalMinutes: 120,
        status: "active",
        autoApproveSafeTools: true,
        provider: "gemini",
        nextRunAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        consecutiveFailures: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "goal-growth-hooks",
        name: "Growth Factory Short-Form Hook Synthesizer",
        objective: "Generate fresh high-retention 9:16 video hooks and outbound sequences for active portfolio offers.",
        intervalMinutes: 180,
        status: "active",
        autoApproveSafeTools: true,
        provider: "agentrouter",
        nextRunAt: new Date(Date.now() + 90 * 60_000).toISOString(),
        consecutiveFailures: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "goal-sandbox-verification",
        name: "Autonomous CI/CD & Sandbox Health Verification",
        objective: "Run automated Python & TypeScript verification suites and confirm zero build regressions.",
        intervalMinutes: 240,
        status: "active",
        autoApproveSafeTools: true,
        provider: "gemini",
        nextRunAt: new Date(Date.now() + 120 * 60_000).toISOString(),
        consecutiveFailures: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];
    try {
      this.save();
    } catch {}
  }

  private save() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(this.goals, null, 2));
    fs.renameSync(tmp, FILE);
  }

  private row(r: any): AutonomousGoal {
    return {
      id: r.id, name: r.name, objective: r.objective,
      intervalMinutes: Number(r.interval_minutes), status: r.status,
      autoApproveSafeTools: Boolean(r.auto_approve_safe_tools),
      provider: r.provider || undefined, model: r.model || undefined,
      nextRunAt: new Date(r.next_run_at).toISOString(),
      lastRunAt: r.last_run_at ? new Date(r.last_run_at).toISOString() : undefined,
      lastJobId: r.last_job_id || undefined,
      consecutiveFailures: Number(r.consecutive_failures || 0),
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString()
    };
  }

  async start() {
    if (process.env.VERCEL === "1" || this.timer) return;
    await this.tick().catch(() => {});
    this.timer = setInterval(() => void this.tick().catch(() => {}), Number(process.env.AUTONOMY_TICK_MS || 15000));
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async status() {
    const durable = Boolean(await getSql());
    const goals = durable ? await this.list() : this.goals;
    return {
      enabled: process.env.AUTONOMY_ENABLED !== "false",
      durableStore: durable,
      running: Boolean(this.timer) || process.env.AUTONOMY_ENABLED !== "false",
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === "active").length,
      runningJobs: this.runningCount,
      maxConcurrency: MAX_CONCURRENCY,
      heartbeatAt: new Date().toISOString()
    };
  }

  async list() {
    const db = await getSql();
    if (db) {
      const rows = await db`SELECT * FROM autonomy_goals ORDER BY created_at`;
      return rows.map((r: any) => this.row(r));
    }
    return this.goals;
  }

  async create(input: Partial<AutonomousGoal>) {
    const objective = (input.objective || "").trim();
    if (!objective) throw new Error("objective is required");
    const now = new Date();
    const g: AutonomousGoal = {
      id: input.id || "goal-" + Date.now() + "-" + crypto.randomBytes(3).toString("hex"),
      name: input.name || "Autonomous Objective",
      objective,
      intervalMinutes: Math.max(1, Number(input.intervalMinutes || 60)),
      status: "active",
      autoApproveSafeTools: input.autoApproveSafeTools !== false,
      provider: input.provider || "agentrouter",
      model: input.model,
      nextRunAt: new Date(now.getTime() + 1000).toISOString(),
      consecutiveFailures: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    const db = await getSql();
    if (db) {
      const rows = await db`INSERT INTO autonomy_goals
        (id,name,objective,interval_minutes,status,auto_approve_safe_tools,provider,model,next_run_at,created_at,updated_at)
        VALUES (${g.id},${g.name},${g.objective},${g.intervalMinutes},${g.status},${g.autoApproveSafeTools},${g.provider || null},${g.model || null},${g.nextRunAt},${g.createdAt},${g.updatedAt})
        RETURNING *`;
      return this.row(rows[0]);
    }
    this.goals.push(g); this.save(); return g;
  }

  async update(id: string, patch: Partial<AutonomousGoal>) {
    const db = await getSql();
    if (db) {
      const old = (await db`SELECT * FROM autonomy_goals WHERE id=${id}`)[0];
      if (!old) return undefined;
      const g = this.row(old);
      Object.assign(g, patch, { updatedAt: new Date().toISOString() });
      const rows = await db`UPDATE autonomy_goals SET
        name=${g.name}, objective=${g.objective}, interval_minutes=${g.intervalMinutes},
        status=${g.status}, auto_approve_safe_tools=${g.autoApproveSafeTools},
        provider=${g.provider || null}, model=${g.model || null},
        next_run_at=${g.nextRunAt}, updated_at=${g.updatedAt}
        WHERE id=${id} RETURNING *`;
      return this.row(rows[0]);
    }
    const g = this.goals.find(x => x.id === id);
    if (!g) return undefined;
    Object.assign(g, patch, { updatedAt: new Date().toISOString() });
    this.save(); return g;
  }

  async remove(id: string) {
    const db = await getSql();
    if (db) return (await db`DELETE FROM autonomy_goals WHERE id=${id} RETURNING id`).length > 0;
    const n = this.goals.length;
    this.goals = this.goals.filter(g => g.id !== id);
    this.save(); return this.goals.length < n;
  }

  async triggerGoalNow(id: string) {
    const g = this.goals.find(x => x.id === id);
    if (!g) return undefined;
    await this.local(g);
    return g;
  }

  async tickOnce() { await this.tick(); return this.status(); }

  private async tick() {
    const db = await getSql();
    if (!db) {
      for (const g of this.goals.filter(x => x.status === "active" && Date.parse(x.nextRunAt) <= Date.now()).slice(0, MAX_CONCURRENCY)) {
        await this.local(g);
      }
      return;
    }

    await db`UPDATE autonomy_jobs
      SET status=CASE WHEN attempt >= max_attempts THEN 'failed' ELSE 'waiting' END,
          lease_id=NULL, lease_expires_at=NULL,
          error=COALESCE(error,'Worker lease expired'),
          finished_at=CASE WHEN attempt >= max_attempts THEN now() ELSE NULL END
      WHERE status='active' AND lease_expires_at IS NOT NULL AND lease_expires_at < now()`;

    const waiting = await db`SELECT * FROM autonomy_jobs WHERE status='waiting' ORDER BY created_at LIMIT ${MAX_CONCURRENCY}`;
    for (const r of waiting) await this.run(r.id);

    const due = await db`SELECT * FROM autonomy_goals WHERE status='active' AND next_run_at <= now() ORDER BY next_run_at LIMIT ${MAX_CONCURRENCY}`;
    for (const r of due) await this.dispatch(this.row(r));

    await processDurableAgents();
  }

  private async dispatch(g: AutonomousGoal) {
    const db = await getSql();
    if (!db) return;
    const jobId = "job-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
    const key = g.id + ":" + g.nextRunAt;
    const payload = JSON.stringify({ goalId: g.id, objective: g.objective, provider: g.provider, model: g.model });
    const ins = await db`INSERT INTO autonomy_jobs
      (id,goal_id,status,payload,max_attempts,idempotency_key)
      VALUES (${jobId},${g.id},'waiting',${payload}::jsonb,3,${key})
      ON CONFLICT(idempotency_key) DO NOTHING RETURNING id`;
    if (!ins.length) return;
    const next = new Date(Date.now() + g.intervalMinutes * 60000).toISOString();
    await db`UPDATE autonomy_goals SET last_job_id=${jobId},last_run_at=now(),next_run_at=${next},updated_at=now()
      WHERE id=${g.id} AND status='active'`;
    await this.run(jobId);
  }

  private async run(jobId: string) {
    const db = await getSql();
    if (!db) return;
    const lease = crypto.randomUUID();
    const claimed = await db`UPDATE autonomy_jobs
      SET status='active',attempt=attempt+1,lease_id=${lease},
          lease_expires_at=now()+(${Math.ceil(TIMEOUT_MS / 1000)} || ' seconds')::interval,started_at=now()
      WHERE id=${jobId} AND status='waiting' RETURNING *`;
    if (!claimed.length) return;
    const j = claimed[0];
    this.runningCount++;
    try {
      const result = await Promise.race([
        agentRouterChat({
          model: j.payload?.model,
          user: j.payload?.objective,
          system: "You are AgentStation's bounded execution worker. Perform the objective safely and report only work actually completed."
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Autonomy execution timeout")), TIMEOUT_MS))
      ]);
      await db`UPDATE autonomy_jobs SET status='completed',progress=100,result=${JSON.stringify(result)}::jsonb,
        lease_id=NULL,lease_expires_at=NULL,finished_at=now() WHERE id=${jobId} AND lease_id=${lease}`;
      await db`UPDATE autonomy_goals SET consecutive_failures=0,updated_at=now() WHERE id=${j.goal_id}`;
      await db`INSERT INTO autonomy_usage(job_id,provider,route,metadata)
        VALUES(${jobId},${result.provider || "agentrouter"},${result.model || null},${JSON.stringify({ requestId: result.requestId })}::jsonb)`;
    } catch (e) {
      const msg = (e as Error).message;
      const retry = Number(j.attempt) < Number(j.max_attempts);
      await db`UPDATE autonomy_jobs SET status=${retry ? "waiting" : "failed"},error=${msg},
        lease_id=NULL,lease_expires_at=NULL,finished_at=${retry ? null : new Date().toISOString()}
        WHERE id=${jobId} AND lease_id=${lease}`;
      await db`UPDATE autonomy_goals
        SET consecutive_failures=consecutive_failures+1,
            status=CASE WHEN consecutive_failures+1 >= 3 THEN 'failed' ELSE status END,
            updated_at=now() WHERE id=${j.goal_id}`;
    } finally {
      this.runningCount = Math.max(0, this.runningCount - 1);
    }
  }

  private async local(g: AutonomousGoal) {
    this.runningCount++;
    try {
      if (isAgentRouterConfigured()) {
        await agentRouterChat({
          model: g.model, user: g.objective,
          system: "You are AgentStation's bounded execution worker. Perform the objective safely and report only work actually completed."
        });
      } else {
        await new Promise((r) => setTimeout(r, 250));
      }
      g.lastJobId = "local-" + Date.now();
      g.lastRunAt = new Date().toISOString();
      g.nextRunAt = new Date(Date.now() + g.intervalMinutes * 60000).toISOString();
      g.consecutiveFailures = 0; g.updatedAt = new Date().toISOString(); this.save();
    } catch (e) {
      g.consecutiveFailures++;
      if (g.consecutiveFailures >= 3) g.status = "failed";
      g.updatedAt = new Date().toISOString(); this.save();
      throw e;
    } finally {
      this.runningCount = Math.max(0, this.runningCount - 1);
    }
  }
}

export const autonomy = new AutonomyScheduler();
