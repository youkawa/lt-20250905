import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';


import { StartExportDto } from './dto';
import { ExportsService } from './exports.service';
import { CurrentUser } from '../../common/auth/user.decorator';
import { ExportJobInfoDto } from '../../common/dto/export-job-info.dto';
import { MetricsService } from '../../metrics/metrics.service';
import { ExportQueueService } from '../export-queue/export-queue.service';

@ApiTags('exports')
@Controller()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService, private readonly queue: ExportQueueService, private readonly metrics: MetricsService) {}

  @Post('/exports')
  @ApiBody({ type: StartExportDto })
  @ApiOkResponse({ description: 'Queued export job or immediate result', type: ExportJobInfoDto })
  @ApiResponse({ status: 400, description: 'Bad Request (validation or downstream)', content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ExportJobInfoDto' },
      examples: {
        validation_error: { summary: 'Validation', value: { jobId: 'n/a', status: 'failed', error: 'Validation failed', errorCode: 'HTTP_400' } },
        downstream_4xx: { summary: 'Downstream 4xx', value: { jobId: 'n/a', status: 'failed', error: 'HTTP 404 missing', errorCode: 'HTTP_404' } },
      },
    },
  } })
  @ApiResponse({ status: 504, description: 'Timeout', content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ExportJobInfoDto' },
      examples: {
        timeout: { summary: 'Export service timeout', value: { jobId: 'n/a', status: 'failed', error: 'Export service timeout', errorCode: 'TIMEOUT' } },
      },
    },
  } })
  @ApiResponse({ status: 502, description: 'Upstream failure', content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ExportJobInfoDto' },
      examples: {
        remote_failed: { summary: 'Remote failed', value: { jobId: 'n/a', status: 'failed', error: 'Worker failed', errorCode: 'REMOTE_FAILED' } },
        http_5xx: { summary: 'HTTP 5xx', value: { jobId: 'n/a', status: 'failed', error: 'HTTP 500 down', errorCode: 'HTTP_500' } },
      },
    },
  } })
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
