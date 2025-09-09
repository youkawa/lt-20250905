import { Injectable, Optional } from '@nestjs/common';
import { ExportQueueService } from '../export-queue/export-queue.service';

@Injectable()
export class ProxyService {
  private notebookUrl = process.env.NOTEBOOK_SERVICE_URL || 'http://localhost:8000';
  constructor(@Optional() private readonly queue?: ExportQueueService) {}

  async getExportJob(jobId: string) {
    if (process.env.EXPORT_ASYNC === 'true' && this.queue) {
      const job = this.queue.getJob(jobId);
      if (!job) throw new Error('Notebook service error: 404 Job not found');
      return job;
    }
    const url = `${this.notebookUrl}/export-jobs/${encodeURIComponent(jobId)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const txt = await res.text().catch(() => res.statusText);
      throw new Error(`Notebook service error: ${res.status} ${txt}`);
    }
    return res.json();
  }
}
