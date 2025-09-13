import { Module } from '@nestjs/common';

import { MetricsModule } from '../../metrics/metrics.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportQueueModule } from '../export-queue/export-queue.module';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';

@Module({
  imports: [ExportQueueModule, MetricsModule],
  controllers: [ExportsController],
  providers: [ExportsService, PrismaService],
})
export class ExportsModule {}
