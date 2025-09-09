import { ExportQueueService } from './export-queue.service';
import { ExportWorkerService } from './export-worker.service';
import { ExportWorkerRunner } from './export-worker.runner';
import { ExportsService } from '../exports/exports.service';

describe('ExportWorkerRunner (interval)', () => {
  const OLD = { ASYNC: process.env.EXPORT_ASYNC, INTERVAL: process.env.EXPORT_WORKER_INTERVAL_MS };
  beforeEach(() => {
    jest.useFakeTimers();
    process.env.EXPORT_ASYNC = 'true';
    process.env.EXPORT_WORKER_INTERVAL_MS = '200';
  });
  afterEach(() => {
    jest.useRealTimers();
    process.env.EXPORT_ASYNC = OLD.ASYNC;
    process.env.EXPORT_WORKER_INTERVAL_MS = OLD.INTERVAL;
  });

  it('processes queued job on next tick', async () => {
    const prisma: any = {
      project: { findUnique: jest.fn(async () => ({ name: 'P' })) },
      user: { findUnique: jest.fn(async () => ({ name: 'U' })) },
      template: { findMany: jest.fn(async () => []) },
    };
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ jobId: 'jN', status: 'completed', downloadUrl: '/exports/jN.pptx' }) }));

    const queue = new ExportQueueService();
    const exportsSvc = new ExportsService(prisma);
    const metrics: any = {
      jobsEnqueued: { inc: jest.fn() },
      jobsCompleted: { inc: jest.fn() },
      jobsFailed: { inc: jest.fn() },
      jobsFailedByCode: { labels: () => ({ inc: jest.fn() }) },
      jobDuration: { observe: jest.fn() },
    };
    const worker = new ExportWorkerService(queue, exportsSvc, metrics);
    const runner = new ExportWorkerRunner(worker);
    runner.onModuleInit();

    const enq = queue.enqueueExport({ title: 'R', content: [] });
    expect(queue.getJob(enq.jobId)?.status).toBe('queued');

    // advance interval once
    jest.advanceTimersByTime(220);
    // allow async tasks to settle sufficiently
    const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
    await flush();
    await flush();
    const after = queue.getJob(enq.jobId);
    expect(after?.status).toBe('completed');
    expect(after?.downloadUrl).toBe('/exports/jN.pptx');

    runner.onModuleDestroy();
  });
});
