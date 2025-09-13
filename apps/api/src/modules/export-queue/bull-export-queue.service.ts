import { Injectable } from '@nestjs/common';

type BullQueue = {
  add: (name: string, payload: unknown, opts?: Record<string, unknown>) => Promise<BullJob>;
  getJob: (id: string) => Promise<BullJob | null>;
};
type BullJob = {
  id: string | number;
  opts: { attempts?: number };
  attemptsMade?: number;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  getState: () => Promise<string>;
  getProgress: () => Promise<number>;
  returnvalue?: unknown;
  failedReason?: string;
};

function getBull(): { Queue: new (...args: any[]) => BullQueue; Worker: any; QueueEvents: any } {
  // dynamic require to avoid build-time dependency in non-bull environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('bullmq');
  return mod;
}

@Injectable()
export class BullExportQueueService {
  private queue: BullQueue;
  private name = 'exports';
  constructor() {
    const { Queue } = getBull();
    const connection = this.getConnection();
    this.queue = new Queue(this.name, { connection });
  }

  private getConnection() {
    const url = process.env.REDIS_URL;
    if (url) return { url };
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || '6379');
    return { host, port };
  }

  async enqueueExport(payload: unknown) {
    const attempts = Number(process.env.EXPORT_JOB_ATTEMPTS || '2');
    const backoff = Number(process.env.EXPORT_JOB_BACKOFF_MS || '1000');
    const job: BullJob = await this.queue.add('export', payload, {
      removeOnComplete: true,
      removeOnFail: 50,
      attempts,
      backoff: { type: 'fixed', delay: backoff },
    });
    return { jobId: String(job.id), status: 'queued' as const };
  }

  async getJob(jobId: string) {
    const job: BullJob | null = await this.queue.getJob(jobId);
    if (!job) return undefined;
    const state = await job.getState();
    const progress = await job.getProgress().catch(() => 0);
    const attemptsMax = job?.opts?.attempts ?? undefined;
    const attemptsMade = job?.attemptsMade ?? undefined;
    const createdAt = job?.timestamp ? new Date(job.timestamp).toISOString() : undefined;
    const startedAt = job?.processedOn ? new Date(job.processedOn).toISOString() : undefined;
    const finishedAt = job?.finishedOn ? new Date(job.finishedOn).toISOString() : undefined;
    const durationMs = job?.processedOn && job?.finishedOn ? Math.max(0, job.finishedOn - job.processedOn) : undefined;
    if (state === 'completed') {
      const ret: any = (job as any).returnvalue as any;
      return { jobId: String(job.id), status: 'completed' as const, downloadUrl: ret?.downloadUrl, progress, attemptsMade, attemptsMax, createdAt, startedAt, finishedAt, durationMs };
    }
    if (state === 'failed') {
      return { jobId: String(job.id), status: 'failed' as const, error: job.failedReason, errorCode: 'WORKER_FAILED', progress, attemptsMade, attemptsMax, createdAt, startedAt, finishedAt, durationMs };
    }
    const status = state === 'active' ? 'processing' : 'queued';
    return { jobId: String(job.id), status, progress, attemptsMade, attemptsMax, createdAt, startedAt } as const;
  }

  // no-op to keep interface compatibility
  async processNext(): Promise<undefined> {
    return undefined;
  }
}
