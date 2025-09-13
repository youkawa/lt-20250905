import { test, expect } from '@playwright/test';

test.describe('Admin - template upload and set default', () => {
  test('uploads .pptx and sets as default', async ({ page }) => {
    // 先に fetch をパッチして /templates GET を常に 200 [] に
    await page.addInitScript(() => {
      const original = window.fetch;
      const TPLS: any[] = [];
      let seq = 1;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') {
          return new Response(JSON.stringify(TPLS), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/templates/upload') && method === 'POST') {
          const id = `t${seq++}`;
          TPLS.push({ id, title: 'Corporate', version: 1, content: { originalName: 'CORP.PPTX', filename: 'mock.pptx' }, createdAt: new Date().toISOString() });
          return new Response(JSON.stringify(TPLS[TPLS.length - 1]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const m = url.match(/\/templates\/(.+)\/default$/);
        if (m && method === 'POST') {
          const id = m[1];
          TPLS.forEach(t => (t.content.isDefault = (t.id === id)));
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return original(input as any, init);
      };
    });
    // Simple in-memory state for templates
    type Tpl = { id: string; title: string; version: number; content: any; createdAt: string };
    const db: { templates: Tpl[] } = { templates: [] };

    // Mock API for admin templates
    await page.route('**/templates', async (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname === '/templates' && req.method() === 'GET') return route.fulfill({ json: db.templates });
      return route.fallback();
    });
    await page.route('**/templates/upload', async (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname !== '/templates/upload') return route.fallback();
      if (req.method() !== 'POST') return route.fallback();
      // Push a created template
      const id = `t${db.templates.length + 1}`;
      db.templates.push({
        id,
        title: 'Corporate',
        version: 1,
        content: { originalName: 'CORP.PPTX', filename: `${Date.now()}.pptx` },
        createdAt: new Date().toISOString(),
      });
      return route.fulfill({ json: db.templates[db.templates.length - 1] });
    });
    await page.route('**/templates/*/default', async (route, req) => {
      const { pathname } = new URL(req.url());
      if (!/^\/templates\/.+\/default$/.test(pathname)) return route.fallback();
      if (req.method() !== 'POST') return route.fallback();
      const m = /\/templates\/(.+)\/default/.exec(req.url());
      const id = m?.[1];
      db.templates.forEach((t) => { t.content.isDefault = (t.id === id); });
      return route.fulfill({ json: { ok: true } });
    });
    await page.route('**/templates/*', async (route, req) => {
      const { pathname } = new URL(req.url());
      if (!/^\/templates\/.+$/.test(pathname)) return route.fallback();
      if (req.method() === 'DELETE') {
        const m = /\/templates\/(.+)$/.exec(req.url());
        const id = m?.[1];
        const i = db.templates.findIndex((t) => t.id === id);
        if (i >= 0) db.templates.splice(i, 1);
        return route.fulfill({ json: { ok: true } });
      }
      return route.fallback();
    });

    await page.goto('/admin/templates');

    // 入力: タイトルとバージョン（プレースホルダの国際化に依存しない堅牢なセレクタ）
    const titleInput = page.locator('input[type="text"]:below(:text("アップロード"))').first();
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill('Corporate');
    const ver = page.locator('input[type="number"]:below(:text("アップロード"))').first();
    await ver.fill('1');

    // .pptx ファイルを選択してアップロード
    const input = page.locator('input[type="file"][accept=".pptx"]');
    await input.setInputFiles({ name: 'CORP.PPTX', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: Buffer.from([0x50, 0x50]) });

    // 一覧に行が現れる（テーブルのセルを対象に絞る）
    const cell = page.locator('table >> role=cell[name="Corporate"]');
    await expect(cell).toBeVisible();
    // 既定にする → ✓ 表示
    await page.getByRole('button', { name: '既定にする' }).click();
    await expect(page.getByText('✓')).toBeVisible();
  });
});
