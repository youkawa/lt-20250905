import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { ExportQueueService } from '../export-queue/export-queue.service';
import { ExportWorkerService } from '../export-queue/export-worker.service';

describe('ExportsController (async mode)', () => {
  const OLD = process.env.EXPORT_ASYNC;
  beforeEach(() => { process.env.EXPORT_ASYNC = 'true'; });
  afterEach(() => { process.env.EXPORT_ASYNC = OLD; });

  it('enqueues on POST /exports and worker completes', async () => {
    const prisma: any = {
      project: { findUnique: jest.fn(async () => ({ name: 'P' })) },
      user: { findUnique: jest.fn(async () => ({ name: 'U' })) },
      template: { findMany: jest.fn(async () => []) },
    };
    const svc = new ExportsService(prisma);
    // Mock notebook-service export response
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ jobId: 'nb1', status: 'completed', downloadUrl: '/exports/nb1.pptx' }) }));

    const queue = new ExportQueueService();
    const metrics: any = {
      jobsEnqueued: { inc: jest.fn() },
      jobsCompleted: { inc: jest.fn() },
      jobsFailed: { inc: jest.fn() },
      jobsFailedByCode: { labels: () => ({ inc: jest.fn() }) },
      jobDuration: { observe: jest.fn() },
    };
    const ctrl = new ExportsController(svc, queue, metrics);
    const worker = new ExportWorkerService(queue, svc, metrics);

    const res = await ctrl.start({ id: 'u1' } as any, { title: 'R', content: [] } as any);
    expect(res.status).toBe('queued');
    // process one
    await worker.tickOnce();
    const after = queue.getJob(res.jobId);
    expect(after?.status).toBe('completed');
    expect(after?.downloadUrl).toBe('/exports/nb1.pptx');
  });
});
