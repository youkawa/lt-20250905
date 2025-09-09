import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ExportWorkerService } from './export-worker.service';

@Injectable()
export class ExportWorkerRunner implements OnModuleInit, OnModuleDestroy {
  private timer: any = null;
  constructor(private readonly worker: ExportWorkerService) {}

  onModuleInit() {
    if (process.env.EXPORT_ASYNC !== 'true') return;
    const interval = Number(process.env.EXPORT_WORKER_INTERVAL_MS || '500');
    this.timer = setInterval(() => {
      // Fire and forget; errors are swallowed to keep loop alive
      this.worker.tickOnce().catch(() => void 0);
    }, Math.max(100, interval));
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

