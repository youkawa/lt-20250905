import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ReportsService } from '../reports/reports.service';

describe('ProjectsController', () => {
  const projects = {
    findAllByOwner: jest.fn(async (ownerId: string) => [{ id: 'p1', ownerId }]),
    create: jest.fn(async (ownerId: string, dto: any) => ({ id: 'p1', ownerId, ...dto })),
    findOne: jest.fn(async (id: string) => ({ id, ownerId: 'u1' })),
    delete: jest.fn(async (id: string) => ({ id })),
  } as unknown as ProjectsService;
  const reports = {
    listByProjectOwned: jest.fn(async () => ({ items: [], take: 20, nextCursor: undefined, hasMore: false })),
  } as unknown as ReportsService;
  const ctrl = new ProjectsController(projects, reports);

  it('lists by owner', async () => {
    const res = await ctrl.list({ id: 'u1' } as any);
    expect(Array.isArray(res)).toBe(true);
  });

  it('get throws Forbidden when not owned', async () => {
    await expect(ctrl.get({ id: 'u2' } as any, 'p1')).rejects.toThrow('Forbidden');
  });

  it('delete throws NotFound when project missing', async () => {
    (projects.findOne as any) = jest.fn(async () => null);
    await expect(ctrl.delete({ id: 'u1' } as any, 'p404')).rejects.toThrow('Project not found');
  });
});

