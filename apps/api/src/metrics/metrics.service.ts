import { Injectable } from '@nestjs/common';

import { Counter, Histogram, Registry, collectDefaultMetrics } from './prom-client';

@Injectable()
export class MetricsService {
  registry = new Registry();
  // Use instance types derived from constructor values
  jobsEnqueued!: InstanceType<typeof Counter>;
  jobsCompleted!: InstanceType<typeof Counter>;
  jobsFailed!: InstanceType<typeof Counter>;
  jobsFailedByCode!: InstanceType<typeof Counter>;
  jobDuration!: InstanceType<typeof Histogram>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.jobsEnqueued = new Counter({ name: 'export_jobs_enqueued_total', help: 'Number of export jobs enqueued', registers: [this.registry] });
    this.jobsCompleted = new Counter({ name: 'export_jobs_completed_total', help: 'Number of export jobs completed', registers: [this.registry] });
    this.jobsFailed = new Counter({ name: 'export_jobs_failed_total', help: 'Number of export jobs failed', registers: [this.registry] });
    this.jobsFailedByCode = new Counter({ name: 'export_jobs_failed_by_code_total', help: 'Number of export jobs failed by error code', registers: [this.registry], labelNames: ['error_code'] });
    this.jobDuration = new Histogram({ name: 'export_job_duration_ms', help: 'Export job duration in ms', buckets: [100, 300, 1000, 3000, 10000, 30000, 60000], registers: [this.registry] });
  }
}
