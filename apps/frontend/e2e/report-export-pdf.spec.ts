import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - PDF export', () => {
  test('switches format to PDF and shows pdf link', async ({ page }) => {
    await page.route('**/reports/r1', (route, req) => {
      if (req.method() === 'GET') return route.fulfill({ json: { id: 'r1', projectId: 'p1', title: 'Report', content: [] } });
      if (req.method() === 'PATCH') return route.fulfill({ json: { ok: true } });
      return route.fallback();
    });
    await page.route('**/templates', (route) => route.fulfill({ json: [] }));
    await page.route('**/exports', (route, req) => {
      if (req.method() === 'POST') return route.fulfill({ json: { jobId: 'jpdf', status: 'queued' } });
      return route.fallback();
    });
    let c = 0;
    await page.route('**/export-jobs/jpdf', async (route) => {
      c++;
      if (c < 2) return route.fulfill({ json: { jobId: 'jpdf', status: 'processing' } });
      return route.fulfill({ json: { jobId: 'jpdf', status: 'completed', downloadUrl: '/exports/jpdf.pdf' } });
    });

    await page.goto('/projects/p1/reports/r1');
    // 形式を PDF に変更（形式セレクトはページ内の最後の select）
    const select = page.locator('select').last();
    await expect(select).toHaveValue('pptx');
    await select.selectOption('pdf');
    const btn = page.getByRole('button', { name: 'PDFエクスポート' });
    await btn.click();
    await page.waitForTimeout(1200);
    await page.waitForTimeout(1200);
    const link = page.getByRole('link', { name: '生成ファイルをダウンロード' });
    await expect(link).toHaveAttribute('href', 'http://notebook/exports/jpdf.pdf');
  });
});
