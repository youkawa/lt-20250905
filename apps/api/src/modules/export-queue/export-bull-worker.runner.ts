/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { MetricsService } from '../../metrics/metrics.service';
import { ExportsService } from '../exports/exports.service';

function getBull(): { Worker: any } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('bullmq');
  return mod;
}

@Injectable()
export class ExportBullWorkerRunner implements OnModuleInit, OnModuleDestroy {
  private worker: any = null;
  private name = 'exports';
  constructor(private readonly exportsService: ExportsService, private readonly metrics: MetricsService) {}

  onModuleInit() {
    if (process.env.EXPORT_ASYNC !== 'true' || process.env.EXPORT_QUEUE !== 'bull') return;
    const { Worker } = getBull();
    const connection = this.getConnection();
    this.worker = new Worker(this.name, async (job: any) => {
      const payload = job.data;
      const userId = payload?.userId as string | undefined;
      const res = await this.exportsService.startExport(payload, userId);
      if (res?.status === 'failed') {
        throw new Error(res?.error || 'failed');
      }
      return { downloadUrl: res?.downloadUrl };
    }, { connection, concurrency: Number(process.env.EXPORT_WORKER_CONCURRENCY || '2') });

    // observability: simple console hooks (replace with logger/metrics in production)
    this.worker.on('completed', (job: any, ret: any) => {
      const payload = { level: 'info', event: 'export.completed', jobId: String(job?.id), downloadUrl: ret?.downloadUrl, processedOn: job?.processedOn, finishedOn: job?.finishedOn, durationMs: job?.processedOn && job?.finishedOn ? Math.max(0, job.finishedOn - job.processedOn) : undefined };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(payload));
      try { this.metrics.jobsCompleted.inc(); } catch { void 0; }
      const dur = payload.durationMs;
      if (typeof dur === 'number') {
        try { this.metrics.jobDuration.observe(dur); } catch { void 0; }
      }
    });
    this.worker.on('failed', (job: any, err: any) => {
      const payload = { level: 'error', event: 'export.failed', jobId: String(job?.id), error: err?.message || String(err), attemptsMade: job?.attemptsMade };
      // eslint-disable-next-line no-console
      console.error(JSON.stringify(payload));
      try { this.metrics.jobsFailed.inc(); } catch { void 0; }
      const code = (err && (err.code || err.name)) || 'WORKER_FAILED';
      try { this.metrics.jobsFailedByCode.labels(String(code)).inc(); } catch { void 0; }
      const processedOn = job?.processedOn;
      const finishedOn = job?.finishedOn;
      const dur = processedOn && finishedOn ? Math.max(0, finishedOn - processedOn) : undefined;
      if (typeof dur === 'number') {
        try { this.metrics.jobDuration.observe(dur); } catch { void 0; }
      }
    });
  }

  onModuleDestroy() {
    if (this.worker) {
      this.worker.close().catch(() => void 0);
      this.worker = null;
    }
  }

  private getConnection() {
    const url = process.env.REDIS_URL;
    if (url) return { url };
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || '6379');
    return { host, port };
  }
}
