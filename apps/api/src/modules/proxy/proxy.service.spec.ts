import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn(async () => ({ ok: false, status: 500, statusText: 'err', text: async () => 'boom' }));
  });

  it('throws error when notebook service not ok', async () => {
    const svc = new ProxyService();
    await expect(svc.getExportJob('j1')).rejects.toThrow('Notebook service error: 500 boom');
  });
});

