import { Controller, Get, Param } from '@nestjs/common';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Get('/export-jobs/:jobId')
  getExportJob(@Param('jobId') jobId: string) {
    return this.proxy.getExportJob(jobId);
  }
}

