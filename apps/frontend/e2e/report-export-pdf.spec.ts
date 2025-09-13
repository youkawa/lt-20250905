import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - PDF export', () => {
  test('switches format to PDF and shows pdf link', async ({ page }) => {
    // 安定化: fetch パッチで API をスタブ
    await page.addInitScript(() => {
      const original = window.fetch;
      let poll = 0;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/exports') && method === 'POST') return new Response(JSON.stringify({ jobId: 'jpdf', status: 'queued' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/export-jobs/jpdf')) { poll++; if (poll < 2) return new Response(JSON.stringify({ jobId: 'jpdf', status: 'processing' }), { status: 200, headers: { 'Content-Type': 'application/json' } }); return new Response(JSON.stringify({ jobId: 'jpdf', status: 'completed', downloadUrl: '/exports/jpdf.pdf' }), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');
    // 形式を PDF に変更（ページロード完了を待った後）
    await expect(page.getByText('レポート編集')).toBeVisible();
    const select = page.locator('select').last();
    await select.selectOption('pdf');
    const btn = page.getByRole('button', { name: 'PDFエクスポート' });
    await btn.click();
    await page.waitForTimeout(1200);
    await page.waitForTimeout(1200);
    const link = page.getByRole('link', { name: '生成ファイルをダウンロード' });
    // サーバ既存起動では NOTEBOOK_BASE_URL が http://localhost:8000 のため両対応
    await expect(link).toHaveAttribute('href', /http:\/\/(notebook|localhost:8000)\/exports\/jpdf\.pdf/);
  });
});
