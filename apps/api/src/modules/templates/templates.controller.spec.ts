import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

jest.mock('node:fs/promises', () => ({
  __esModule: true,
  default: {},
  writeFile: jest.fn(async () => undefined),
  mkdir: jest.fn(async () => undefined),
}));

describe('TemplatesController upload', () => {
  const svc = { create: jest.fn(async (dto) => ({ id: 't1', ...dto })) } as unknown as TemplatesService;
  const ctrl = new TemplatesController(svc);

  it('rejects non-pptx upload', async () => {
    const file: any = { originalname: 'a.txt', mimetype: 'text/plain', buffer: Buffer.from('x'), size: 1 };
    await expect(ctrl.upload(file, { title: 'T', version: 1 } as any)).rejects.toThrow('Only .pptx is supported');
  });

  it('accepts pptx upload and calls service', async () => {
    const file: any = {
      originalname: 'a.pptx',
      mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      buffer: Buffer.from('x'),
      size: 3,
    };
    process.env.TEMPLATES_DIR = '/tmp/templates-test';
    const res = await ctrl.upload(file, { title: 'T', version: 1 } as any);
    expect(res.title).toBe('T');
  });
});

