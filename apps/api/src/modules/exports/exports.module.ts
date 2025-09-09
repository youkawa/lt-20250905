import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportQueueModule } from '../export-queue/export-queue.module';
import { MetricsModule } from '../../metrics/metrics.module';

@Module({
  imports: [ExportQueueModule, MetricsModule],
  controllers: [ExportsController],
  providers: [ExportsService, PrismaService],
})
export class ExportsModule {}
