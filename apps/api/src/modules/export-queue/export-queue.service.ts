import { Injectable } from '@nestjs/common';

export type ExportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJobRecord {
  jobId: string;
  status: ExportJobStatus;
  error?: string;
  errorCode?: string;
  downloadUrl?: string;
  payload?: unknown;
  attemptsMade?: number;
  attemptsMax?: number;
  progress?: number;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

@Injectable()
export class ExportQueueService {
  private queue: ExportJobRecord[] = [];
  private jobs = new Map<string, ExportJobRecord>();

  enqueueExport(payload: unknown): ExportJobRecord {
    const jobId = Math.random().toString(16).slice(2);
    const now = new Date().toISOString();
    const rec: ExportJobRecord = { jobId, status: 'queued', payload, attemptsMade: 0, attemptsMax: 1, progress: 0, createdAt: now };
    this.queue.push(rec);
    this.jobs.set(jobId, rec);
    return { jobId, status: rec.status } as ExportJobRecord;
  }

  getJob(jobId: string): ExportJobRecord | undefined {
    const j = this.jobs.get(jobId);
    if (!j) return undefined;
    const { payload: _payload, ...rest } = j;
    return { ...rest } as ExportJobRecord;
  }

  /**
   * Process one job using given processor. Intended for a worker loop.
   */
  async processNext(
    processor: (payload: unknown) => Promise<{ status: 'completed' | 'failed'; downloadUrl?: string; error?: string; errorCode?: string }>,
  ): Promise<ExportJobRecord | undefined> {
    const job = this.queue.shift();
    if (!job) return undefined;
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    job.attemptsMade = (job.attemptsMade || 0) + 1;
    this.jobs.set(job.jobId, job);
    try {
      const res = await processor(job.payload);
      if (res.status === 'completed') {
        job.status = 'completed';
        job.downloadUrl = res.downloadUrl;
      } else {
        job.status = 'failed';
        job.error = res.error || 'failed';
        job.errorCode = res.errorCode || 'WORKER_FAILED';
      }
    } catch (e: unknown) {
      const err = e as Error;
      job.status = 'failed';
      job.error = err?.message || 'failed';
      job.errorCode = 'WORKER_THROW';
    }
    job.finishedAt = new Date().toISOString();
    if (job.startedAt && job.finishedAt) job.durationMs = Math.max(0, new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime());
    this.jobs.set(job.jobId, job);
    // return public shape
    const { payload: _payload2, ...rest } = job;
    return { ...rest } as ExportJobRecord;
  }
}
