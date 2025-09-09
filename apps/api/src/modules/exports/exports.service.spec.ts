import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  const makeTemplate = (id: string, version: number, content: any = {}, extra: any = {}) => ({
    id,
    title: id,
    version,
    content,
    createdAt: extra.createdAt || new Date('2024-01-01T00:00:00Z'),
    updatedAt: extra.updatedAt || new Date('2024-01-01T00:00:00Z'),
  });

  const makePrisma = (templates: any[] = []) => {
    const db = { templates: [...templates] } as any;
    return {
      template: {
        findUnique: jest.fn(async ({ where: { id } }: any) => db.templates.find((t: any) => t.id === id)),
        findMany: jest.fn(async () => db.templates),
      },
    } as any;
  };

  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ jobId: 'j1', status: 'completed' }) }));
  });

  it('resolves templatePath from templateId', async () => {
    const prisma = makePrisma([makeTemplate('t1', 2, { storagePath: '/templates/t1.pptx' })]);
    const svc = new ExportsService(prisma);
    const res = await svc.startExport({ title: 'R', content: [], templateId: 't1' });
    expect(res.jobId).toBe('j1');
    expect(global.fetch).toHaveBeenCalled();
    const args = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(args[1].body);
    expect(body.templatePath).toBe('/templates/t1.pptx');
  });

  it('auto-selects default template by rules specificity and tie-breakers', async () => {
    const templates = [
      // low score global default
      makeTemplate('g', 1, { isDefault: true }, { updatedAt: new Date('2024-01-01') }),
      // projectId only
      makeTemplate('p', 1, { rules: [{ projectId: 'p1', isDefault: true }] }, { updatedAt: new Date('2024-02-01') }),
      // titlePattern only
      makeTemplate('t', 1, { rules: [{ titlePattern: 'Sales', isDefault: true }] }, { updatedAt: new Date('2024-03-01') }),
      // both projectId & titlePattern (highest specificity)
      makeTemplate('pt', 1, { rules: [{ projectId: 'p1', titlePattern: 'Q[1-4]', isDefault: true, createdAt: new Date('2024-04-01') }] }, { updatedAt: new Date('2024-04-02') }),
    ];
    (templates as any[]).forEach((t) => (t.content.storagePath = `/templates/${t.id}.pptx`));
    const prisma = makePrisma(templates);
    const svc = new ExportsService(prisma);
    await svc.startExport({ title: 'Q1 Sales', content: [], metadata: { projectId: 'p1' } });
    const args = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(args[1].body);
    expect(body.templatePath).toBe('/templates/pt.pptx');
  });

  it('throws when template storagePath missing', async () => {
    const prisma = makePrisma([makeTemplate('t1', 1, {})]);
    const svc = new ExportsService(prisma);
    await expect(svc.startExport({ title: 'R', content: [], templateId: 't1' })).rejects.toThrow('Template storage path missing');
  });
});

