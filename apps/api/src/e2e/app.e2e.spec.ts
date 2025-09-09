import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../modules/app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('App e2e (HTTP layer)', () => {
  let app: INestApplication;
  let prisma: any;

  beforeAll(async () => {
    process.env.TEMPLATES_DIR = require('node:path').join(require('node:os').tmpdir(), 'templates-e2e');
    // Simple in-memory prisma mock
    const db = {
      users: [
        { id: 'admin', email: 'admin@example.com', role: 'ADMIN', name: 'Admin' },
        { id: 'u1', email: 'u1@example.com', role: 'USER', name: 'U1' },
      ],
      projects: [] as any[],
      reports: [] as any[],
      templates: [] as any[],
    };

    prisma = {
      user: {
        findUnique: jest.fn(async ({ where: { id, email } }: any) =>
          db.users.find((u) => (id ? u.id === id : u.email === email)),
        ),
        findMany: jest.fn(async () => db.users),
        create: jest.fn(async ({ data }: any) => {
          const u = { id: data.id || `u${db.users.length + 1}`, ...data };
          db.users.push(u);
          return u;
        }),
      },
      project: {
        create: jest.fn(async ({ data }: any) => {
          const p = { id: `p${db.projects.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data };
          db.projects.push(p);
          return p;
        }),
        findMany: jest.fn(async ({ where: { ownerId } }: any) => db.projects.filter((p) => p.ownerId === ownerId)),
        findUnique: jest.fn(async ({ where: { id } }: any) => db.projects.find((p) => p.id === id)),
        delete: jest.fn(async ({ where: { id } }: any) => {
          const i = db.projects.findIndex((p) => p.id === id);
          const r = db.projects.splice(i, 1)[0];
          return r;
        }),
        findFirst: jest.fn(async ({ where: { id, ownerId } }: any) =>
          db.projects.find((p) => p.id === id && p.ownerId === ownerId),
        ),
      },
      report: {
        findFirst: jest.fn(async ({ where: { projectId, title }, orderBy }: any) => {
          const list = db.reports.filter((r) => r.projectId === projectId && r.title === title);
          if (!list.length) return null;
          return list.sort((a, b) => b.version - a.version)[0];
        }),
        create: jest.fn(async ({ data }: any) => {
          const r = { id: `r${db.reports.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data };
          db.reports.push(r);
          return r;
        }),
        findUnique: jest.fn(async ({ where: { id } }: any) => db.reports.find((r) => r.id === id)),
        update: jest.fn(async ({ where: { id }, data }: any) => {
          const i = db.reports.findIndex((r) => r.id === id);
          db.reports[i] = { ...db.reports[i], ...data, updatedAt: new Date() };
          return db.reports[i];
        }),
        findMany: jest.fn(async ({ where: { projectId }, take, cursor }: any) => {
          const start = cursor?.id ? db.reports.findIndex((r) => r.id === cursor.id) + 1 : 0;
          return db.reports.filter((r) => r.projectId === projectId).slice(start, start + (take || 20));
        }),
      },
      template: {
        create: jest.fn(async ({ data }: any) => {
          const t = { id: `t${db.templates.length + 1}`, createdAt: new Date(), updatedAt: new Date(), ...data };
          db.templates.push(t);
          return t;
        }),
        findMany: jest.fn(async () => db.templates),
        findUnique: jest.fn(async ({ where: { id } }: any) => db.templates.find((t) => t.id === id)),
        update: jest.fn(async ({ where: { id }, data }: any) => {
          const i = db.templates.findIndex((t) => t.id === id);
          db.templates[i] = { ...db.templates[i], ...data, updatedAt: new Date() };
          return db.templates[i];
        }),
        delete: jest.fn(async ({ where: { id } }: any) => {
          const i = db.templates.findIndex((t) => t.id === id);
          return db.templates.splice(i, 1)[0];
        }),
      },
    };

    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Mock fetch for exports/proxy
    // @ts-ignore
    global.fetch = jest.fn(async (_url, _init) => ({ ok: true, json: async () => ({ jobId: 'j1', status: 'completed', downloadUrl: '/exports/j1.pptx' }) }));
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies without auth header', async () => {
    await request(app.getHttpServer()).get('/projects').expect(403);
  });

  it('projects CRUD ownership', async () => {
    // create
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('X-User-Id', 'u1')
      .send({ name: 'Project A' })
      .expect(201);
    const project = created.body;
    expect(project.ownerId).toBe('u1');

    // list
    const list = await request(app.getHttpServer()).get('/projects').set('X-User-Id', 'u1').expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    // get forbidden by other user
    await request(app.getHttpServer()).get(`/projects/${project.id}`).set('X-User-Id', 'admin').expect(403);
  });

  it('reports create auto version and listByProject', async () => {
    // prepare project
    const p = (await request(app.getHttpServer()).post('/projects').set('X-User-Id', 'u1').send({ name: 'P' })).body;
    // create v1
    const r1 = await request(app.getHttpServer())
      .post('/reports')
      .set('X-User-Id', 'u1')
      .send({ projectId: p.id, title: 'T', content: [] })
      .expect(201);
    expect(r1.body.version).toBe(1);
    // create v2
    const r2 = await request(app.getHttpServer())
      .post('/reports')
      .set('X-User-Id', 'u1')
      .send({ projectId: p.id, title: 'T', content: [] })
      .expect(201);
    expect(r2.body.version).toBe(2);
    // listByProject
    const list = await request(app.getHttpServer()).get(`/projects/${p.id}/reports`).set('X-User-Id', 'u1').expect(200);
    expect(Array.isArray(list.body.items)).toBe(true);
  });

  it('templates upload requires admin and default selection affects exports', async () => {
    // upload (mock fs writes in controller are real; but path is inside container and should be fine in test env)
    const resUpload = await request(app.getHttpServer())
      .post('/templates/upload')
      .set('X-User-Id', 'admin')
      .attach('file', Buffer.from([0x50, 0x50]), 't.pptx')
      .field('title', 'Corporate')
      .field('version', '1')
      .expect(201);
    const tpl = resUpload.body;
    expect(tpl.title).toBe('Corporate');

    // set global default
    await request(app.getHttpServer()).post(`/templates/${tpl.id}/default`).set('X-User-Id', 'admin').expect(201);

    // exports without specifying templateId picks default
    const start = await request(app.getHttpServer())
      .post('/exports')
      .set('X-User-Id', 'u1')
      .send({ title: 'Quarterly', content: [], metadata: { projectId: 'p1' } })
      .expect(201);
    expect(start.body.jobId).toBeDefined();
  });

  it('templates global default switching via API clears others', async () => {
    // Seed two templates directly
    const a = await prisma.template.create({ data: { title: 'A', version: 1, content: { storagePath: '/t/A.pptx', isDefault: true } } });
    const b = await prisma.template.create({ data: { title: 'B', version: 1, content: { storagePath: '/t/B.pptx', isDefault: false } } });
    // Switch default to B
    await request(app.getHttpServer()).post(`/templates/${b.id}/default`).set('X-User-Id', 'admin').expect(201);
    const list = await request(app.getHttpServer()).get('/templates').set('X-User-Id', 'u1').expect(200);
    const tA = list.body.find((x: any) => x.id === a.id);
    const tB = list.body.find((x: any) => x.id === b.id);
    expect(!!tA.content?.isDefault).toBe(false);
    expect(!!tB.content?.isDefault).toBe(true);
  });

  it('template selection honors rule specificity and tie-breakers', async () => {
    // Reset fetch to capture body
    const fetchMock = jest.fn(async (_url, init: any) => ({ ok: true, json: async () => ({ jobId: 'jX', status: 'completed', body: init?.body }) }));
    // @ts-ignore
    global.fetch = fetchMock;
    // Prepare a project to resolve projectName
    const p = await prisma.project.create({ data: { id: 'p-fixed', name: 'Project Fixed', ownerId: 'u1' } });
    // Seed multiple templates
    const now = (s: string) => new Date(s);
    const mk = async (id: string, version: number, content: any, updatedAt: Date, createdAt: Date) =>
      prisma.template.create({ data: { id, title: id, version, content, updatedAt, createdAt } });
    await mk('g', 1, { storagePath: '/t/g.pptx', isDefault: true }, now('2024-01-01'), now('2024-01-01'));
    await mk('p', 1, { storagePath: '/t/p.pptx', rules: [{ projectId: p.id, isDefault: true }] }, now('2024-02-01'), now('2024-02-01'));
    await mk('t', 1, { storagePath: '/t/t.pptx', rules: [{ titlePattern: 'Sales', isDefault: true }] }, now('2024-03-01'), now('2024-03-01'));
    await mk('pt', 1, { storagePath: '/t/pt.pptx', rules: [{ projectId: p.id, titlePattern: 'Q[1-4]', isDefault: true }] }, now('2024-04-02'), now('2024-04-01'));
    // Start export without specifying templateId
    await request(app.getHttpServer())
      .post('/exports')
      .set('X-User-Id', 'u1')
      .send({ title: 'Q1 Sales', content: [{ origin: { notebookName: 'n1.ipynb' } }], metadata: { projectId: p.id } })
      .expect(201);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.templatePath).toBe('/t/pt.pptx');
    expect(body.metadata.projectName).toBe('Project Fixed');
    expect(body.metadata.author).toBeDefined();
    expect(body.metadata.dataSources).toEqual(['n1.ipynb']);

    // Tie-break by version: add another with same specificity but higher version
    await mk('pt2', 2, { storagePath: '/t/pt2.pptx', rules: [{ projectId: p.id, titlePattern: 'Q[1-4]', isDefault: true }] }, now('2024-04-01'), now('2024-04-01'));
    await request(app.getHttpServer())
      .post('/exports')
      .set('X-User-Id', 'u1')
      .send({ title: 'Q2 Sales', content: [], metadata: { projectId: p.id } })
      .expect(201);
    const body2 = JSON.parse((fetchMock.mock.calls[1][1] as any).body);
    expect(body2.templatePath).toBe('/t/pt2.pptx');

    // Tie-break by updatedAt: same version, newer updatedAt wins
    await mk('pt3', 2, { storagePath: '/t/pt3.pptx', rules: [{ projectId: p.id, titlePattern: 'Q[1-4]', isDefault: true }] }, now('2024-05-01'), now('2024-04-01'));
    await request(app.getHttpServer())
      .post('/exports')
      .set('X-User-Id', 'u1')
      .send({ title: 'Q3 Sales', content: [], metadata: { projectId: p.id } })
      .expect(201);
    const body3 = JSON.parse((fetchMock.mock.calls[2][1] as any).body);
    expect(body3.templatePath).toBe('/t/pt3.pptx');
  });

  it('template selection final tie-breaks by createdAt when version and updatedAt equal', async () => {
    const fetchMock = jest.fn(async (_url, init: any) => ({ ok: true, json: async () => ({ jobId: 'jTie', status: 'completed', body: init?.body }) }));
    // @ts-ignore
    global.fetch = fetchMock;
    const now = (s: string) => new Date(s);
    const mk = async (id: string, version: number, content: any, updatedAt: Date, createdAt: Date) =>
      prisma.template.create({ data: { id, title: id, version, content, updatedAt, createdAt } });
    const proj = await prisma.project.create({ data: { id: 'p-fixed2', name: 'Proj 2', ownerId: 'u1' } });
    // Three templates with same specificity/version/updatedAt, different createdAt
    await mk('pt3', 2, { storagePath: '/t/pt3.pptx', rules: [{ projectId: proj.id, titlePattern: 'Q[1-4]', isDefault: true }] }, now('2024-05-01'), now('2024-04-01'));
    await mk('pt4', 2, { storagePath: '/t/pt4.pptx', rules: [{ projectId: proj.id, titlePattern: 'Q[1-4]', isDefault: true }] }, now('2024-05-01'), now('2024-04-01'));
    await mk('pt5', 2, { storagePath: '/t/pt5.pptx', rules: [{ projectId: proj.id, titlePattern: 'Q[1-4]', isDefault: true }] }, now('2024-05-01'), now('2024-06-01'));

    await request(app.getHttpServer())
      .post('/exports')
      .set('X-User-Id', 'u1')
      .send({ title: 'Q4 Sales', content: [], metadata: { projectId: proj.id } })
      .expect(201);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.templatePath).toBe('/t/pt5.pptx');
  });

  it('proxy returns 500 when notebook service fails', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, statusText: 'Err', text: async () => 'down' }));
    await request(app.getHttpServer()).get('/export-jobs/j1').set('X-User-Id', 'u1').expect(500);
  });

  it('exports returns failed status when notebook job fails', async () => {
    // Mock notebook service to return failed job
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ jobId: 'jF', status: 'failed', error: 'kaleido failed' }) }));
    const res = await request(app.getHttpServer())
      .post('/exports')
      .set('X-User-Id', 'u1')
      .send({ title: 'Failing', content: [], metadata: { projectId: 'p1' } })
      .expect(201);
    expect(res.body.status).toBe('failed');
    expect(res.body.error).toBeDefined();
  });

  it('proxy success path passes through notebook job json', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ jobId: 'j2', status: 'completed', downloadUrl: '/exports/j2.pptx' }) }));
    const res = await request(app.getHttpServer()).get('/export-jobs/j2').set('X-User-Id', 'u1').expect(200);
    expect(res.body.jobId).toBe('j2');
    expect(res.body.status).toBe('completed');
  });

  it('template upload accepts uppercase extension and rejects missing file', async () => {
    // Accepts uppercase extension
    await request(app.getHttpServer())
      .post('/templates/upload')
      .set('X-User-Id', 'admin')
      .attach('file', Buffer.from([0x50, 0x50]), 'CORP.PPTX')
      .field('title', 'Upper')
      .field('version', '1')
      .expect(201);

    // Missing file -> 400
    await request(app.getHttpServer())
      .post('/templates/upload')
      .set('X-User-Id', 'admin')
      .field('title', 'NoFile')
      .field('version', '1')
      .expect(400);
  });

  it('template upload accepts correct MIME without extension and rejects when both wrong', async () => {
    // Accepts when MIME is correct even if no extension
    await request(app.getHttpServer())
      .post('/templates/upload')
      .set('X-User-Id', 'admin')
      .attach('file', Buffer.from([0x50, 0x50]), {
        filename: 'NOEXT',
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      })
      .field('title', 'MimeOnly')
      .field('version', '1')
      .expect(201);

    // Rejects when both extension and MIME are wrong
    await request(app.getHttpServer())
      .post('/templates/upload')
      .set('X-User-Id', 'admin')
      .attach('file', Buffer.from([0x50]), { filename: 'BAD', contentType: 'application/octet-stream' })
      .field('title', 'Bad')
      .field('version', '1')
      .expect(400);
  });

  it('proxy returns 500 when notebook service 404', async () => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found', text: async () => 'missing' }));
    await request(app.getHttpServer()).get('/export-jobs/j404').set('X-User-Id', 'u1').expect(500);
  });
});
