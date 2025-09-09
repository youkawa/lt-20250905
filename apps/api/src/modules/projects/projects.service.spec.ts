import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const prisma = {
    project: {
      create: jest.fn(async (args) => ({ id: 'p1', ...args.data })),
      findMany: jest.fn(async () => [{ id: 'p1', name: 'T', ownerId: 'u1' }]),
      findUnique: jest.fn(async ({ where: { id } }: any) => ({ id, name: 'T', ownerId: 'u1' })),
      delete: jest.fn(async ({ where: { id } }: any) => ({ id })),
    },
  } as any;
  const svc = new ProjectsService(prisma);

  it('create project', async () => {
    const res = await svc.create('u1', { name: 'Hello' });
    expect(res.name).toBe('Hello');
    expect(prisma.project.create).toHaveBeenCalled();
  });

  it('list by owner', async () => {
    const res = await svc.findAllByOwner('u1');
    expect(Array.isArray(res)).toBe(true);
  });
});
