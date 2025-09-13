import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - export failure handling', () => {
  test('shows alert when export job fails', async ({ page }) => {
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
      if (req.method() === 'POST') return route.fulfill({ json: { jobId: 'jF', status: 'queued' } });
      return route.fallback();
    });
    await page.route('**/export-jobs/jF', (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname !== '/export-jobs/jF') return route.fallback();
      return route.fulfill({ json: { jobId: 'jF', status: 'failed', error: 'kaleido failed' } });
    });

    await page.goto('/projects/p1/reports/r1');

    // アラート監視
    const dialogs: string[] = [];
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });

    // エクスポートボタン押下
    const btn = page.getByRole('button', { name: 'PPTXエクスポート' });
    await btn.click();

    // ポーリング1回分待機
    await page.waitForTimeout(1100);

    // 失敗アラートが表示される
    await expect.poll(() => dialogs.length, { message: 'alert not shown' }).toBeGreaterThan(0);
    expect(dialogs.some((m) => /エクスポートに失敗/.test(m) || /failed/i.test(m))).toBeTruthy();
  });
});
