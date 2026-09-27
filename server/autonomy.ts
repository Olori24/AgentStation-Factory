import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { AgentOrchestrator } from './orchestrator';

export type AutonomyGoalStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface AutonomyGoal {
  id: string;
  name: string;
  objective: string;
  intervalMinutes: number;
  status: AutonomyGoalStatus;
  autoApproveSafeTools: boolean;
  provider?: 'gemini' | 'ollama';
  model?: string;
  nextRunAt: string;
  lastRunAt?: string;
  lastMissionId?: string;
  consecutiveFailures: number;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = process.env.AGENTSTATION_DATA_DIR || path.join(process.cwd(), 'data');
const GOALS_FILE = path.join(DATA_DIR, 'autonomy_goals.json');

class AutonomousRuntime {
  private goals: AutonomyGoal[] = [];
  private timer: NodeJS.Timeout | null = null;
  private activeMissions = new Set<string>();
  private started = false;

  constructor() {
    this.load();
  }

  private load() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(GOALS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(GOALS_FILE, 'utf8'));
        if (Array.isArray(parsed)) this.goals = parsed;
      }
    } catch (error: any) {
      console.warn('[Autonomy] Could not load goals:', error.message);
    }
  }

  private save() {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = GOALS_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.goals, null, 2), 'utf8');
      fs.renameSync(tmp, GOALS_FILE);
    } catch (error: any) {
      console.error('[Autonomy] Could not persist goals:', error.message);
    }
  }

  start() {
    if (this.started || process.env.AUTONOMY_ENABLED !== 'true' || process.env.VERCEL === '1') return;
    this.started = true;
    const intervalMs = Math.max(5000, Number(process.env.AUTONOMY_TICK_MS || 15000));
    this.timer = setInterval(() => void this.tick(), intervalMs);
    void this.tick();
    console.log(`[Autonomy] 24/7 runtime started; tick=${intervalMs}ms goals=${this.goals.length}`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }

  list() {
    return this.goals;
  }

  create(input: {
    name: string;
    objective: string;
    intervalMinutes?: number;
    autoApproveSafeTools?: boolean;
    provider?: 'gemini' | 'ollama';
    model?: string;
  }) {
    const now = new Date();
    const goal: AutonomyGoal = {
      id: `goal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: input.name.trim(),
      objective: input.objective.trim(),
      intervalMinutes: Math.max(5, Math.min(10080, Number(input.intervalMinutes || 60))),
      status: 'active',
      autoApproveSafeTools: Boolean(input.autoApproveSafeTools),
      provider: input.provider,
      model: input.model,
      nextRunAt: now.toISOString(),
      consecutiveFailures: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    if (!goal.name || !goal.objective) throw new Error('Goal name and objective are required.');
    this.goals.unshift(goal);
    this.save();
    void this.tick();
    return goal;
  }

  update(id: string, patch: Partial<Pick<AutonomyGoal, 'name' | 'objective' | 'intervalMinutes' | 'status' | 'autoApproveSafeTools' | 'provider' | 'model'>>) {
    const goal = this.goals.find((item) => item.id === id);
    if (!goal) throw new Error('Autonomy goal not found.');
    Object.assign(goal, patch);
    if (patch.intervalMinutes !== undefined) {
      goal.intervalMinutes = Math.max(5, Math.min(10080, Number(patch.intervalMinutes)));
    }
    goal.updatedAt = new Date().toISOString();
    this.save();
    return goal;
  }

  remove(id: string) {
    const before = this.goals.length;
    this.goals = this.goals.filter((goal) => goal.id !== id);
    this.save();
    return this.goals.length !== before;
  }

  private async tick() {
    if (!this.started || this.activeMissions.size >= Number(process.env.AUTONOMY_MAX_CONCURRENCY || 2)) return;
    const now = Date.now();

    for (const goal of this.goals) {
      if (this.activeMissions.size >= Number(process.env.AUTONOMY_MAX_CONCURRENCY || 2)) break;
      if (goal.status !== 'active' || Date.parse(goal.nextRunAt) > now) continue;

      const missionId = `auto-${goal.id}-${Date.now()}`;
      const mission = {
        id: missionId,
        title: `Autonomous: ${goal.name}`,
        prompt: goal.objective,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { autonomous: true, goalId: goal.id, goalName: goal.name },
      };

      db.upsertMission(mission);
      goal.lastRunAt = new Date().toISOString();
      goal.lastMissionId = missionId;
      goal.nextRunAt = new Date(Date.now() + goal.intervalMinutes * 60000).toISOString();
      goal.updatedAt = new Date().toISOString();
      this.save();

      this.activeMissions.add(missionId);
      void AgentOrchestrator.executeMission(missionId, {
        autoApproveSafeTools: goal.autoApproveSafeTools,
        provider: goal.provider,
        model: goal.model,
      }).then(() => {
        const latest = db.getMissionById(missionId);
        if (latest?.status === 'completed') {
          goal.consecutiveFailures = 0;
        } else {
          goal.consecutiveFailures++;
        }
        goal.updatedAt = new Date().toISOString();
        this.save();
      }).catch((error: any) => {
        goal.consecutiveFailures++;
        goal.updatedAt = new Date().toISOString();
        this.save();
        console.error(`[Autonomy] Mission ${missionId} failed:`, error.message);
      }).finally(() => {
        this.activeMissions.delete(missionId);
      });
    }
  }

  status() {
    return {
      enabled: process.env.AUTONOMY_ENABLED === 'true',
      running: this.started,
      goals: this.goals.length,
      activeMissions: this.activeMissions.size,
      maxConcurrency: Number(process.env.AUTONOMY_MAX_CONCURRENCY || 2),
      tickMs: Number(process.env.AUTONOMY_TICK_MS || 15000),
    };
  }
}

export const autonomy = new AutonomousRuntime();
