import crypto from 'crypto';
import { EventEmitter } from 'events';
import { db, JobRecord } from './db';
import { streaming } from './streaming';

export type JobType = 'mission_synthesis' | 'sandbox_test' | 'video_render' | 'github_sync' | 'autonomous_mission';

export interface JobOptions {
  maxAttempts?: number;
  priority?: number;
  missionId?: string;
}

export interface EnqueuedJob<T = any> {
  id: string;
  type: JobType;
  missionId?: string;
  payload: T;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: any;
  leaseId?: string;
  leaseExpiresAt?: string;
  error?: string;
}

type JobWorkerHandler<T = any, R = any> = (job: EnqueuedJob<T>, updateProgress: (pct: number, msg?: string) => void) => Promise<R>;

class BackgroundJobQueue extends EventEmitter {
  private queue: EnqueuedJob[] = [];
  private workers: Map<JobType, JobWorkerHandler> = new Map();
  private isProcessing = false;
  private concurrency = 2;
  private activeCount = 0;
  private readonly leaseMs = Number(process.env.JOB_LEASE_MS || 120000);

  constructor() {
    super();
    this.recoverPersistedJobs();
    // Vercel functions are request-scoped; do not keep a perpetual event-loop
    // worker alive there. Hosted jobs are triggered explicitly by the API.
    if (process.env.VERCEL !== "1") {
      setInterval(() => this.tick(), 1000);
    }
  }

  public registerWorker<T, R>(type: JobType, handler: JobWorkerHandler<T, R>) {
    this.workers.set(type, handler);
  }

  public enqueue<T>(type: JobType, payload: T, options?: JobOptions): EnqueuedJob<T> {
    const job: EnqueuedJob<T> = {
      id: `job-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type,
      missionId: options?.missionId,
      payload,
      status: 'waiting',
      progress: 0,
      attempt: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(job);
    this.syncDb(job);
    streaming.streamJobProgress(job.id, 0, 'waiting', `Job enqueued (${type})`);

    // Trigger tick immediately
    setImmediate(() => this.tick());
    return job;
  }

  private recoverPersistedJobs() {
    const persisted = db.getJobs(500);
    for (const record of persisted) {
      if (record.status !== 'waiting' && record.status !== 'active') continue;
      const payload = record.payload || {};
      const stale = record.status === 'active' && record.leaseExpiresAt && Date.parse(record.leaseExpiresAt) < Date.now();
      const job: EnqueuedJob = {
        id: record.id, type: record.type, missionId: record.missionId, payload,
        status: stale ? 'waiting' : record.status, progress: record.progress,
        attempt: record.attempt, maxAttempts: record.maxAttempts, createdAt: record.createdAt,
        startedAt: stale ? undefined : record.startedAt, result: record.result, error: stale ? 'Recovered after worker lease expiry' : record.error,
        finishedAt: record.finishedAt, leaseId: stale ? undefined : record.leaseId, leaseExpiresAt: stale ? undefined : record.leaseExpiresAt,
      };
      this.queue.push(job);
    }
    if (this.queue.length) setImmediate(() => this.tick());
  }

  public getJob(id: string): EnqueuedJob | undefined {
    return this.queue.find((j) => j.id === id);
  }

  public getAllJobs(limit = 50): EnqueuedJob[] {
    return this.queue.slice(-limit).reverse();
  }

  public getStats() {
    const waiting = this.queue.filter((j) => j.status === 'waiting').length;
    const active = this.queue.filter((j) => j.status === 'active').length;
    const completed = this.queue.filter((j) => j.status === 'completed').length;
    const failed = this.queue.filter((j) => j.status === 'failed').length;
    return {
      total: this.queue.length,
      waiting,
      active,
      completed,
      failed,
      concurrency: this.concurrency,
    };
  }

  private async tick() {
    if (this.activeCount >= this.concurrency) return;

    const nextJob = this.queue.find((j) => j.status === 'waiting');
    if (!nextJob) return;

    const worker = this.workers.get(nextJob.type);
    if (!worker) {
      nextJob.status = 'failed';
      nextJob.error = `No worker registered for job type: ${nextJob.type}`;
      this.syncDb(nextJob);
      return;
    }

    this.activeCount++;
    nextJob.status = 'active';
    nextJob.attempt++;
    nextJob.leaseId = crypto.randomUUID();
    nextJob.leaseExpiresAt = new Date(Date.now() + this.leaseMs).toISOString();
    nextJob.startedAt = new Date().toISOString();
    this.syncDb(nextJob);
    streaming.streamJobProgress(nextJob.id, 5, 'active', `Job processing started (attempt ${nextJob.attempt})`);

    const updateProgress = (pct: number, msg?: string) => {
      nextJob.progress = Math.min(100, Math.max(0, pct));
      this.syncDb(nextJob);
      streaming.streamJobProgress(nextJob.id, nextJob.progress, 'active', msg);
    };

    try {
      const result = await worker(nextJob, updateProgress);
      nextJob.status = 'completed';
      nextJob.progress = 100;
      nextJob.leaseExpiresAt = undefined;
      nextJob.result = result;
      nextJob.finishedAt = new Date().toISOString();
      this.syncDb(nextJob);
      streaming.streamJobProgress(nextJob.id, 100, 'completed', 'Job completed successfully');
      this.emit('completed', nextJob);
    } catch (err: any) {
      if (nextJob.attempt < nextJob.maxAttempts) {
        nextJob.status = 'waiting';
        nextJob.leaseId = undefined;
        nextJob.leaseExpiresAt = undefined;
        nextJob.error = `Attempt ${nextJob.attempt} failed: ${err.message}. Retrying...`;
        streaming.streamJobProgress(nextJob.id, nextJob.progress, 'waiting', nextJob.error);
      } else {
        nextJob.status = 'failed';
        nextJob.leaseId = undefined;
        nextJob.leaseExpiresAt = undefined;
        nextJob.error = err.message || 'Unknown error occurred during job execution';
        nextJob.finishedAt = new Date().toISOString();
        streaming.streamJobProgress(nextJob.id, nextJob.progress, 'failed', nextJob.error);
      }
      this.syncDb(nextJob);
      this.emit('failed', nextJob);
    } finally {
      this.activeCount--;
      setImmediate(() => this.tick());
    }
  }

  private syncDb(job: EnqueuedJob) {
    db.upsertJob({
      id: job.id,
      type: job.type,
      missionId: job.missionId,
      status: job.status,
      progress: job.progress,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      payload: job.payload,
      leaseId: job.leaseId,
      leaseExpiresAt: job.leaseExpiresAt,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    });
  }
}

export const jobQueue = new BackgroundJobQueue();
