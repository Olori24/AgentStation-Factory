import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer' | 'reviewer';
  avatar: string;
  organizationId: string;
  createdAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  tier: 'enterprise' | 'pro' | 'starter';
  quotaRemaining: number;
  createdAt: string;
}

export interface DbMissionRecord {
  id: string;
  userId?: string;
  organizationId?: string;
  title?: string;
  prompt: string;
  status: 'draft' | 'running' | 'completed' | 'failed' | string;
  targetRepo?: string;
  branch?: string;
  filesCount?: number;
  durationMs?: number;
  currentStage?: string;
  progressPercent?: number;
  files?: any[];
  execution?: any;
  video?: any;
  logs?: any[];
  gitBranch?: string;
  gitCommitMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkspaceFileRecord {
  id: string;
  missionId: string;
  path: string;
  language: string;
  content: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface AgentLogRecord {
  id: string;
  missionId: string;
  agentName: string;
  role?: string;
  stepType?: string;
  type?: string;
  status?: 'info' | 'running' | 'success' | 'warning' | 'error' | string;
  message: string;
  details?: string;
  payload?: any;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  type: 'mission_synthesis' | 'sandbox_test' | 'video_render' | 'github_sync';
  missionId?: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number; // 0 - 100
  attempt: number;
  maxAttempts: number;
  result?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface SubtaskRecord {
  id: string;
  missionId: string;
  order: number;
  title: string;
  description: string;
  agentRole: 'architect' | 'developer' | 'qa' | 'creative' | 'video_producer' | 'researcher' | 'system';
  toolName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'waiting_approval' | 'skipped';
  requiresApproval?: boolean;
  retries: number;
  maxRetries: number;
  output?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolExecutionRecord {
  id: string;
  missionId: string;
  subtaskId?: string;
  agentRole: string;
  toolName: string;
  inputParams: Record<string, any>;
  outputResult?: any;
  exitCode?: number;
  status: 'success' | 'failed' | 'requires_approval' | 'rejected';
  durationMs: number;
  timestamp: string;
}

export interface ApprovalRecord {
  id: string;
  missionId: string;
  subtaskId?: string;
  toolName: string;
  actionDescription: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export interface ErrorLogRecord {
  id: string;
  missionId: string;
  subtaskId?: string;
  agentRole: string;
  errorType: string;
  message: string;
  stack?: string;
  resolved: boolean;
  resolutionAttempt?: string;
  timestamp: string;
}

export interface UserSettingsRecord {
  id: string;
  userId: string;
  defaultProvider: 'gemini' | 'ollama';
  ollamaUrl: string;
  ollamaModel: string;
  geminiModel: string;
  safeMode: boolean;
  autoApproveSafeTools: boolean;
  maxSubtasksPerMission: number;
  executionTimeoutSec: number;
  updatedAt: string;
}

export interface DatabaseSchema {
  version: number;
  users: UserRecord[];
  organizations: OrganizationRecord[];
  missions: DbMissionRecord[];
  subtasks: SubtaskRecord[];
  toolExecutions: ToolExecutionRecord[];
  approvals: ApprovalRecord[];
  errors: ErrorLogRecord[];
  settings: UserSettingsRecord[];
  files: WorkspaceFileRecord[];
  logs: AgentLogRecord[];
  jobs: JobRecord[];
  systemMetrics: {
    totalMissionsSynthesized: number;
    totalSandboxExecutions: number;
    totalGitCommits: number;
    totalVideosRendered: number;
    totalToolExecutions: number;
    totalApprovalsProcessed: number;
    totalErrorsRecovered: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'agentstation_relational_db.json');

const DEFAULT_ORG: OrganizationRecord = {
  id: 'org-station-01',
  name: 'AgentStation Core Engineering',
  slug: 'agentstation-core',
  tier: 'enterprise',
  quotaRemaining: 98500,
  createdAt: new Date().toISOString(),
};

const DEFAULT_USERS: UserRecord[] = [
  {
    id: 'user-bolaji-01',
    email: 'bakande11@gmail.com',
    name: 'Bolaji Akande',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizationId: DEFAULT_ORG.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cypher-dev',
    email: 'cypher.dev@agentstation.io',
    name: 'Cypher (Senior Engineer)',
    role: 'engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    organizationId: DEFAULT_ORG.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-sentinel-qa',
    email: 'sentinel.qa@agentstation.io',
    name: 'Sentinel (Lead QA Reviewer)',
    role: 'reviewer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    organizationId: DEFAULT_ORG.id,
    createdAt: new Date().toISOString(),
  },
];

class RelationalDatabase {
  private data: DatabaseSchema = {
    version: 1,
    users: DEFAULT_USERS,
    organizations: [DEFAULT_ORG],
    missions: [],
    subtasks: [],
    toolExecutions: [],
    approvals: [],
    errors: [],
    settings: [],
    files: [],
    logs: [],
    jobs: [],
    systemMetrics: {
      totalMissionsSynthesized: 0,
      totalSandboxExecutions: 0,
      totalGitCommits: 0,
      totalVideosRendered: 0,
      totalToolExecutions: 0,
      totalApprovalsProcessed: 0,
      totalErrorsRecovered: 0,
    },
  };
  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          subtasks: parsed.subtasks || [],
          toolExecutions: parsed.toolExecutions || [],
          approvals: parsed.approvals || [],
          errors: parsed.errors || [],
          settings: parsed.settings || [],
          users: parsed.users?.length ? parsed.users : DEFAULT_USERS,
          organizations: parsed.organizations?.length ? parsed.organizations : [DEFAULT_ORG],
        };
      } else {
        this.saveImmediately();
      }
      this.isLoaded = true;
    } catch (err: any) {
      console.warn('[DB] Failed to load database file, using in-memory defaults:', err.message);
      this.isLoaded = true;
    }
  }

  public saveImmediately() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err: any) {
      console.error('[DB] Write failed:', err.message);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveImmediately();
    }, 500);
  }

  // --- Users & Orgs ---
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getOrganizations(): OrganizationRecord[] {
    return this.data.organizations;
  }

  // --- Missions ---
  public getMissions(limit = 100): DbMissionRecord[] {
    return this.data.missions.slice(0, limit);
  }

  public getMissionById(id: string): DbMissionRecord | undefined {
    return this.data.missions.find((m) => m.id === id);
  }

  public upsertMission(mission: DbMissionRecord): DbMissionRecord {
    const idx = this.data.missions.findIndex((m) => m.id === mission.id);
    if (idx >= 0) {
      this.data.missions[idx] = { ...this.data.missions[idx], ...mission, updatedAt: new Date().toISOString() };
    } else {
      this.data.missions.unshift(mission);
      this.data.systemMetrics.totalMissionsSynthesized++;
    }
    this.scheduleSave();
    return mission;
  }

  public deleteMission(id: string): boolean {
    const prevLen = this.data.missions.length;
    this.data.missions = this.data.missions.filter((m) => m.id !== id);
    this.data.subtasks = this.data.subtasks.filter((s) => s.missionId !== id);
    this.data.toolExecutions = this.data.toolExecutions.filter((t) => t.missionId !== id);
    this.data.approvals = this.data.approvals.filter((a) => a.missionId !== id);
    this.data.errors = this.data.errors.filter((e) => e.missionId !== id);
    this.data.files = this.data.files.filter((f) => f.missionId !== id);
    this.data.logs = this.data.logs.filter((l) => l.missionId !== id);
    this.scheduleSave();
    return this.data.missions.length < prevLen;
  }

  // --- Subtasks ---
  public getSubtasks(missionId: string): SubtaskRecord[] {
    return this.data.subtasks.filter((s) => s.missionId === missionId).sort((a, b) => a.order - b.order);
  }

  public saveSubtasks(missionId: string, subtasks: SubtaskRecord[]) {
    this.data.subtasks = this.data.subtasks.filter((s) => s.missionId !== missionId);
    this.data.subtasks.push(...subtasks);
    this.scheduleSave();
  }

  public updateSubtask(subtaskId: string, patch: Partial<SubtaskRecord>): SubtaskRecord | undefined {
    const idx = this.data.subtasks.findIndex((s) => s.id === subtaskId);
    if (idx >= 0) {
      this.data.subtasks[idx] = {
        ...this.data.subtasks[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
      return this.data.subtasks[idx];
    }
    return undefined;
  }

  // --- Tool Executions ---
  public addToolExecution(exec: Omit<ToolExecutionRecord, 'id' | 'timestamp'>): ToolExecutionRecord {
    const record: ToolExecutionRecord = {
      ...exec,
      id: `tool-exec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.data.toolExecutions.push(record);
    this.incrementMetric('totalToolExecutions');
    if (this.data.toolExecutions.length > 2000) {
      this.data.toolExecutions.splice(0, this.data.toolExecutions.length - 2000);
    }
    this.scheduleSave();
    return record;
  }

  public getToolExecutions(missionId?: string): ToolExecutionRecord[] {
    if (missionId) {
      return this.data.toolExecutions.filter((t) => t.missionId === missionId);
    }
    return this.data.toolExecutions.slice(-100);
  }

  // --- Approvals ---
  public createApproval(approval: Omit<ApprovalRecord, 'id' | 'requestedAt' | 'status'>): ApprovalRecord {
    const record: ApprovalRecord = {
      ...approval,
      id: `appr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    this.data.approvals.push(record);
    this.scheduleSave();
    return record;
  }

  public getApprovals(missionId?: string): ApprovalRecord[] {
    if (missionId) {
      return this.data.approvals.filter((a) => a.missionId === missionId);
    }
    return this.data.approvals;
  }

  public getPendingApprovals(missionId?: string): ApprovalRecord[] {
    return this.data.approvals.filter((a) => a.status === 'pending' && (!missionId || a.missionId === missionId));
  }

  public resolveApproval(approvalId: string, approved: boolean, responder = 'admin'): ApprovalRecord | undefined {
    const record = this.data.approvals.find((a) => a.id === approvalId);
    if (record) {
      record.status = approved ? 'approved' : 'rejected';
      record.respondedAt = new Date().toISOString();
      record.respondedBy = responder;
      this.incrementMetric('totalApprovalsProcessed');
      this.scheduleSave();
      return record;
    }
    return undefined;
  }

  // --- Errors ---
  public addErrorLog(err: Omit<ErrorLogRecord, 'id' | 'timestamp'>): ErrorLogRecord {
    const record: ErrorLogRecord = {
      ...err,
      id: `err-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
    };
    this.data.errors.push(record);
    if (record.resolved) {
      this.incrementMetric('totalErrorsRecovered');
    }
    if (this.data.errors.length > 500) {
      this.data.errors.splice(0, this.data.errors.length - 500);
    }
    this.scheduleSave();
    return record;
  }

  public getErrors(missionId?: string): ErrorLogRecord[] {
    if (missionId) {
      return this.data.errors.filter((e) => e.missionId === missionId);
    }
    return this.data.errors.slice(-50);
  }

  // --- Settings ---
  public getUserSettings(userId: string): UserSettingsRecord {
    let setting = this.data.settings.find((s) => s.userId === userId);
    if (!setting) {
      setting = {
        id: `settings-${userId}`,
        userId,
        defaultProvider: 'gemini',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3',
        geminiModel: 'gemini-3.8-flash',
        safeMode: true,
        autoApproveSafeTools: true,
        maxSubtasksPerMission: 6,
        executionTimeoutSec: 120,
        updatedAt: new Date().toISOString(),
      };
      this.data.settings.push(setting);
      this.scheduleSave();
    }
    return setting;
  }

  public updateUserSettings(userId: string, patch: Partial<UserSettingsRecord>): UserSettingsRecord {
    const setting = this.getUserSettings(userId);
    Object.assign(setting, patch, { updatedAt: new Date().toISOString() });
    this.scheduleSave();
    return setting;
  }

  // --- Workspace Files ---
  public getFilesByMission(missionId: string): WorkspaceFileRecord[] {
    return this.data.files.filter((f) => f.missionId === missionId);
  }

  public saveFilesForMission(missionId: string, files: Array<{ path: string; language: string; content: string }>) {
    this.data.files = this.data.files.filter((f) => f.missionId !== missionId);
    for (const file of files) {
      this.data.files.push({
        id: `file-${crypto.randomBytes(4).toString('hex')}`,
        missionId,
        path: file.path,
        language: file.language,
        content: file.content,
        sizeBytes: Buffer.byteLength(file.content, 'utf8'),
        updatedAt: new Date().toISOString(),
      });
    }
    this.scheduleSave();
  }

  // --- Agent Logs ---
  public getLogsByMission(missionId: string): AgentLogRecord[] {
    return this.data.logs.filter((l) => l.missionId === missionId);
  }

  public addLog(log: Omit<AgentLogRecord, 'id' | 'createdAt'>): AgentLogRecord {
    const record: AgentLogRecord = {
      ...log,
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    this.data.logs.push(record);
    if (this.data.logs.length > 1000) {
      this.data.logs.splice(0, this.data.logs.length - 1000);
    }
    this.scheduleSave();
    return record;
  }

  // --- Jobs ---
  public getJobs(limit = 50): JobRecord[] {
    return this.data.jobs.slice(0, limit);
  }

  public getJobById(id: string): JobRecord | undefined {
    return this.data.jobs.find((j) => j.id === id);
  }

  public upsertJob(job: JobRecord): JobRecord {
    const idx = this.data.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.jobs[idx] = job;
    } else {
      this.data.jobs.unshift(job);
    }
    if (this.data.jobs.length > 200) {
      this.data.jobs.pop();
    }
    this.scheduleSave();
    return job;
  }

  public incrementMetric(key: keyof DatabaseSchema['systemMetrics']) {
    if (this.data.systemMetrics[key] !== undefined) {
      this.data.systemMetrics[key]++;
      this.scheduleSave();
    }
  }

  public getMetrics() {
    return {
      ...this.data.systemMetrics,
      totalUsers: this.data.users.length,
      totalMissions: this.data.missions.length,
      totalFiles: this.data.files.length,
      totalLogs: this.data.logs.length,
      totalJobs: this.data.jobs.length,
    };
  }

  public getSnapshot(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }
}

export const db = new RelationalDatabase();
