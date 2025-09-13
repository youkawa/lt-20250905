import { Module } from '@nestjs/common';

import { MetricsModule } from '../../metrics/metrics.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportsService } from '../exports/exports.service';
import { BullExportQueueService } from './bull-export-queue.service';
import { ExportBullWorkerRunner } from './export-bull-worker.runner';
import { ExportQueueService } from './export-queue.service';
import { ExportWorkerRunner } from './export-worker.runner';
import { ExportWorkerService } from './export-worker.service';

@Module({
  imports: [MetricsModule],
  providers: [
    { provide: ExportQueueService, useClass: process.env.EXPORT_QUEUE === 'bull' ? BullExportQueueService : ExportQueueService },
    ExportWorkerService,
    ExportWorkerRunner,
    ExportBullWorkerRunner,
    ExportsService,
    PrismaService,
  ],
  exports: [ExportQueueService, ExportWorkerService, ExportWorkerRunner, ExportBullWorkerRunner],
})
export class ExportQueueModule {}
