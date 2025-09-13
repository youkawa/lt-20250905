import { Module } from '@nestjs/common';

import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { MetricsModule } from '../../metrics/metrics.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportQueueModule } from '../export-queue/export-queue.module';

@Module({
  imports: [ExportQueueModule, MetricsModule],
  controllers: [ExportsController],
  providers: [ExportsService, PrismaService],
})
export class ExportsModule {}
