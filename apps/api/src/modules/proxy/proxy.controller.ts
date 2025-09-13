import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ProxyService } from './proxy.service';
import { ExportJobInfoDto } from '../../common/dto/export-job-info.dto';

@ApiTags('export-jobs')
@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Get('/export-jobs/:jobId')
  @ApiOkResponse({ type: ExportJobInfoDto })
  getExportJob(@Param('jobId') jobId: string) {
    return this.proxy.getExportJob(jobId);
  }
}
