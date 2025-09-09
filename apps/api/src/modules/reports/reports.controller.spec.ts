import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  const reports = {
    create: jest.fn(async () => ({ id: 'r1' })),
    findOneOwned: jest.fn(async (_owner: string, id: string) => ({ id })),
    updateOwned: jest.fn(async (_owner: string, id: string, dto: any) => ({ id, ...dto })),
    listByProjectOwned: jest.fn(async () => ({ items: [], take: 20, nextCursor: undefined, hasMore: false })),
  } as unknown as ReportsService;
  const ctrl = new ReportsController(reports);

  it('get propagates not found', async () => {
    (reports.findOneOwned as any) = jest.fn(async () => { throw new Error('Report not found'); });
    await expect(ctrl.get({ id: 'u1' } as any, 'r404')).rejects.toThrow('Report not found');
  });

  it('create passes through to service', async () => {
    (reports.create as any) = jest.fn(async () => ({ id: 'r1', version: 1 }));
    const res = await ctrl.create({ id: 'u1' } as any, { projectId: 'p1', title: 'T', content: [] } as any);
    expect(res.id).toBe('r1');
  });
});

