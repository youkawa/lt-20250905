import { Injectable } from '@nestjs/common';

import { ExportQueueService } from './export-queue.service';
import { MetricsService } from '../../metrics/metrics.service';
import { ExportsService } from '../exports/exports.service';

@Injectable()
export class ExportWorkerService {
  constructor(private readonly queue: ExportQueueService, private readonly exportsService: ExportsService, private readonly metrics: MetricsService) {}

  /**
   * Process a single job by delegating to ExportsService (FastAPI /export).
   * Intended to be called on an interval by a scheduler in real deployment.
   */
  async tickOnce(): Promise<void> {
    const result = await this.queue.processNext(async (payload) => {
      type Payload = { userId?: string } & Record<string, unknown>;
      const p = (payload as Payload) || {};
      const userId = typeof p.userId === 'string' ? p.userId : undefined;
      const res: any = await this.exportsService.startExport(p as any, userId);
      if (res?.status === 'completed') {
        try { this.metrics.jobsCompleted.inc(); } catch { /* noop */ }
        return { status: 'completed', downloadUrl: res.downloadUrl };
      }
      if (res?.status === 'failed') {
        try { this.metrics.jobsFailed.inc(); } catch { /* noop */ }
        return { status: 'failed', error: res.error, errorCode: res.errorCode };
      }
      // If notebook-service returns queued/processing, treat as completed without URL (or polling strategy could be added)
      try { this.metrics.jobsCompleted.inc(); } catch { /* noop */ }
      return { status: 'completed', downloadUrl: res?.downloadUrl };
    });
    if (result && typeof result.durationMs === 'number') {
      try { this.metrics.jobDuration.observe(result.durationMs); } catch { /* noop */ }
    }
    if (result?.status === 'failed') {
      const code = result.errorCode || 'WORKER_FAILED';
      try { this.metrics.jobsFailedByCode.labels(String(code)).inc(); } catch { /* noop */ }
    }
  }
}
