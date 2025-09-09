import { test, expect } from '@playwright/test';

test.describe('Admin - template upload and set default', () => {
  test('uploads .pptx and sets as default', async ({ page }) => {
    // Simple in-memory state for templates
    type Tpl = { id: string; title: string; version: number; content: any; createdAt: string };
    const db: { templates: Tpl[] } = { templates: [] };

    // Mock API for admin templates
    await page.route('**/templates', async (route, req) => {
      if (req.method() === 'GET') return route.fulfill({ json: db.templates });
      return route.fallback();
    });
    await page.route('**/templates/upload', async (route, req) => {
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
      if (req.method() !== 'POST') return route.fallback();
      const m = /\/templates\/(.+)\/default/.exec(req.url());
      const id = m?.[1];
      db.templates.forEach((t) => { t.content.isDefault = (t.id === id); });
      return route.fulfill({ json: { ok: true } });
    });
    await page.route('**/templates/*', async (route, req) => {
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

    // 入力: タイトルとバージョン
    await page.getByPlaceholder('タイトル').fill('Corporate');
    const ver = page.getByPlaceholder('バージョン');
    await ver.fill('1');

    // .pptx ファイルを選択してアップロード
    const input = page.locator('input[type="file"][accept=".pptx"]');
    await input.setInputFiles({ name: 'CORP.PPTX', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: Buffer.from([0x50, 0x50]) });

    // 一覧に行が現れる
    await expect(page.getByText('Corporate')).toBeVisible();
    // 既定にする → ✓ 表示
    await page.getByRole('button', { name: '既定にする' }).click();
    await expect(page.getByText('✓')).toBeVisible();
  });
});

