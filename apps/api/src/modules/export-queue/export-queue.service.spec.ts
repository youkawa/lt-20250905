import { ExportQueueService } from './export-queue.service';

describe('ExportQueueService (in-memory skeleton)', () => {
  it('enqueues and processes to completed', async () => {
    const q = new ExportQueueService();
    const enq = q.enqueueExport({ title: 'R', content: [] });
    expect(enq.status).toBe('queued');
    const before = q.getJob(enq.jobId);
    expect(before?.status).toBe('queued');
    expect(before?.createdAt).toBeDefined();
    const processed = await q.processNext(async () => ({ status: 'completed', downloadUrl: '/exports/j1.pptx' }));
    expect(processed?.status).toBe('completed');
    expect(processed?.downloadUrl).toBe('/exports/j1.pptx');
    expect(processed?.finishedAt).toBeDefined();
  });

  it('processes to failed on processor error', async () => {
    const q = new ExportQueueService();
    const { jobId } = q.enqueueExport({ title: 'bad', content: [] });
    const processed = await q.processNext(async () => {
      throw new Error('boom');
    });
    expect(processed?.status).toBe('failed');
    const got = q.getJob(jobId);
    expect(got?.status).toBe('failed');
    expect(got?.error).toMatch(/boom/);
  });

  it('returns undefined when no job', async () => {
    const q = new ExportQueueService();
    const res = await q.processNext(async () => ({ status: 'completed' }));
    expect(res).toBeUndefined();
  });
});
