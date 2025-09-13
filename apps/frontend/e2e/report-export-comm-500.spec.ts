import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - export 500 error', () => {
  test('alerts on 500 from export-jobs', async ({ page }) => {
    await page.route('**/reports/r1', (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname !== '/reports/r1') return route.fallback();
      if (req.method() === 'GET') return route.fulfill({ json: { id: 'r1', projectId: 'p1', title: 'Report', content: [] } });
      if (req.method() === 'PATCH') return route.fulfill({ json: { ok: true } });
      return route.fallback();
    });
    await page.route('**/templates', (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname === '/templates') return route.fulfill({ json: [] });
      return route.fallback();
    });
    await page.route('**/exports', (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname !== '/exports') return route.fallback();
      if (req.method() === 'POST') return route.fulfill({ json: { jobId: 'jE', status: 'queued' } });
      return route.fallback();
    });
    // 500 エラーを返す
    await page.route('**/export-jobs/jE', (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname !== '/export-jobs/jE') return route.fallback();
      return route.fulfill({ status: 500, body: 'down' });
    });

    await page.goto('/projects/p1/reports/r1');
    const dialogs: string[] = [];
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });

    await page.getByRole('button', { name: 'PPTXエクスポート' }).click();
    await page.waitForTimeout(1100);

    await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    expect(dialogs.join(' ')).toMatch(/失敗|failed|500/i);
  });
});
