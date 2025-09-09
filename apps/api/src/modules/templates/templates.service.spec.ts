import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const makePrisma = (templates: any[] = []) => {
    const db = { templates: [...templates] } as any;
    return {
      template: {
        create: jest.fn(async ({ data }: any) => {
          const rec = { id: `${Math.random()}`, createdAt: new Date(), updatedAt: new Date(), ...data };
          db.templates.push(rec);
          return rec;
        }),
        findMany: jest.fn(async () => db.templates),
        findUnique: jest.fn(async ({ where: { id } }: any) => db.templates.find((t: any) => t.id === id)),
        update: jest.fn(async ({ where: { id }, data }: any) => {
          const i = db.templates.findIndex((t: any) => t.id === id);
          db.templates[i] = { ...db.templates[i], ...data, updatedAt: new Date() };
          return db.templates[i];
        }),
        delete: jest.fn(async ({ where: { id } }: any) => {
          const i = db.templates.findIndex((t: any) => t.id === id);
          const r = db.templates.splice(i, 1)[0];
          return r;
        }),
      },
    } as any;
  };

  it('sets global default exclusively', async () => {
    const prisma = makePrisma([
      { id: 'a', title: 'A', version: 1, content: { isDefault: false } },
      { id: 'b', title: 'B', version: 1, content: { isDefault: true } },
    ]);
    const svc = new TemplatesService(prisma);
    await svc.setDefault('a');
    const all = await prisma.template.findMany();
    const recA = all.find((t: any) => t.id === 'a');
    const recB = all.find((t: any) => t.id === 'b');
    expect(recA.content.isDefault).toBe(true);
    expect(recB.content.isDefault).toBe(false);
  });

  it('appends scoped default rule to rules array', async () => {
    const prisma = makePrisma([{ id: 'a', title: 'A', version: 1, content: {} }]);
    const svc = new TemplatesService(prisma);
    await svc.setDefault('a', { projectId: 'p1' } as any);
    const got = await svc.get('a');
    expect(Array.isArray((got.content as any).rules)).toBe(true);
    expect((got.content as any).rules[0]).toMatchObject({ projectId: 'p1', isDefault: true });
  });
});

