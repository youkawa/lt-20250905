import { Body, Controller, Post } from '@nestjs/common';

import { StartExportDto } from './dto';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../../common/auth/user.decorator';
import { MetricsService } from '../../metrics/metrics.service';
import { ExportQueueService } from '../export-queue/export-queue.service';

@Controller()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService, private readonly queue: ExportQueueService, private readonly metrics: MetricsService) {}

  @Post('/exports')
  start(@CurrentUser() user: { id: string } | undefined, @Body() dto: StartExportDto) {
    if (process.env.EXPORT_ASYNC === 'true') {
      const rec = this.queue.enqueueExport({ ...dto, userId: user?.id });
      try { this.metrics.jobsEnqueued.inc(); } catch {
        void 0;
      }
      return rec;
    }
    return this.exportsService.startExport(dto, user?.id);
  }
}
