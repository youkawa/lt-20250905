import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  const prisma = {
    report: {
      findFirst: jest.fn(async () => ({ version: 2 })),
      create: jest.fn(async ({ data }) => ({ id: 'r1', ...data })),
      findUnique: jest.fn(async ({ where: { id } }: any) => ({ id, project: { ownerId: 'u1' } })),
      update: jest.fn(async ({ where: { id }, data }: any) => ({ id, ...data })),
      findMany: jest.fn(async () => [{ id: 'r1' }]),
    },
    project: {
      findFirst: jest.fn(async () => ({ id: 'p1' })),
    },
  } as any;
  const svc = new ReportsService(prisma);

  it('auto-increments version on create', async () => {
    const res = await svc.create('u1', { projectId: 'p1', title: 'T', content: {} } as any);
    expect(res.version).toBe(3);
  });

  it('list by project', async () => {
    const res = await svc.listByProjectOwned('u1', 'p1');
    expect(Array.isArray(res.items)).toBe(true);
  });

  it('throws Forbidden when project not owned', async () => {
    (prisma.project.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await expect(svc.create('u2', { projectId: 'p1', title: 'T', content: {} } as any)).rejects.toThrow('Forbidden');
  });

  it('throws NotFound when report missing', async () => {
    (prisma.report.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(svc.findOneOwned('u1', 'r404')).rejects.toThrow('Report not found');
  });
});
