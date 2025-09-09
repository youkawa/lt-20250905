/**
 * BullMQ integration smoke test (requires Redis).
 * This test is skipped unless CI_BULL_TEST=true or REDIS_URL is set.
 */
import { BullExportQueueService } from './bull-export-queue.service';
import { ExportBullWorkerRunner } from './export-bull-worker.runner';
import { ExportsService } from '../exports/exports.service';

const shouldRun = () => process.env.CI_BULL_TEST === 'true' || !!process.env.REDIS_URL;

const maybe = shouldRun() ? describe : describe.skip;

maybe('BullMQ queue integration', () => {
  const OLD = {
    ASYNC: process.env.EXPORT_ASYNC,
    QUEUE: process.env.EXPORT_QUEUE,
    REDIS: process.env.REDIS_URL,
  };

  beforeAll(() => {
    process.env.EXPORT_ASYNC = 'true';
    process.env.EXPORT_QUEUE = 'bull';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  });

  afterAll(() => {
    process.env.EXPORT_ASYNC = OLD.ASYNC;
    process.env.EXPORT_QUEUE = OLD.QUEUE;
    process.env.REDIS_URL = OLD.REDIS;
  });

  it('processes a job to completion', async () => {
    const prisma: any = {
      project: { findUnique: jest.fn(async () => ({ name: 'P' })) },
      user: { findUnique: jest.fn(async () => ({ name: 'U' })) },
      template: { findMany: jest.fn(async () => []) },
    };
    // Mock notebook-service export
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ jobId: 'nbX', status: 'completed', downloadUrl: '/exports/nbX.pptx' }) }));

    const queue = new BullExportQueueService();
    const exportsSvc = new ExportsService(prisma);
    const metrics: any = {
      jobsEnqueued: { inc: jest.fn() },
      jobsCompleted: { inc: jest.fn() },
      jobsFailed: { inc: jest.fn() },
      jobsFailedByCode: { labels: () => ({ inc: jest.fn() }) },
      jobDuration: { observe: jest.fn() },
    };
    const runner = new ExportBullWorkerRunner(exportsSvc, metrics);
    runner.onModuleInit();

    const enq = await queue.enqueueExport({ title: 'R', content: [] });
    expect(enq.status).toBe('queued');

    // poll until completed (max ~5s)
    const until = Date.now() + 5000;
    let state: any;
    while (Date.now() < until) {
      state = await queue.getJob(enq.jobId);
      if (state?.status === 'completed' || state?.status === 'failed') break;
      await new Promise((r) => setTimeout(r, 200));
    }
    expect(state?.status).toBe('completed');
    expect(state?.downloadUrl).toBe('/exports/nbX.pptx');

    // cleanup
    runner.onModuleDestroy();
    // @ts-ignore
    if ((queue as any).queue?.close) await (queue as any).queue.close();
  }, 20000);
});
