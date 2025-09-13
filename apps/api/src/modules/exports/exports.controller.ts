import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { StartExportDto } from './dto';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../../common/auth/user.decorator';
import { MetricsService } from '../../metrics/metrics.service';
import { ExportQueueService } from '../export-queue/export-queue.service';

@ApiTags('exports')
@Controller()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService, private readonly queue: ExportQueueService, private readonly metrics: MetricsService) {}

  @Post('/exports')
  @ApiBody({ type: StartExportDto })
  @ApiOkResponse({ description: 'Queued export job or immediate result', schema: {
    oneOf: [
      { type: 'object', properties: { jobId: { type: 'string' }, status: { type: 'string', enum: ['queued','processing','completed','failed'] } }, required: ['jobId','status'] },
      { type: 'object', properties: { jobId: { type: 'string' }, status: { type: 'string' }, downloadUrl: { type: 'string' } }, required: ['jobId','status'] }
    ]
  }})
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
