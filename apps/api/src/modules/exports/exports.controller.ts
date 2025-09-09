import { Body, Controller, Post } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { StartExportDto } from './dto';
import { CurrentUser } from '../../common/auth/user.decorator';
import { ExportQueueService } from '../export-queue/export-queue.service';
import { MetricsService } from '../../metrics/metrics.service';

@Controller()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService, private readonly queue: ExportQueueService, private readonly metrics: MetricsService) {}

  @Post('/exports')
  start(@CurrentUser() user: { id: string } | undefined, @Body() dto: StartExportDto) {
    if (process.env.EXPORT_ASYNC === 'true') {
      const rec = this.queue.enqueueExport({ ...dto, userId: user?.id });
      try { this.metrics.jobsEnqueued.inc(); } catch (_) {}
      return rec;
    }
    return this.exportsService.startExport(dto, user?.id);
  }
}
