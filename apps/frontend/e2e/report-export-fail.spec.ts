import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - export failure handling', () => {
  test('shows alert when export job fails', async ({ page }) => {
    await page.addInitScript(() => {
      const original = window.fetch;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/exports') && method === 'POST') return new Response(JSON.stringify({ jobId: 'jF', status: 'queued' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/export-jobs/jF')) return new Response(JSON.stringify({ jobId: 'jF', status: 'failed', error: 'kaleido failed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');

    // アラート監視
    // 失敗はトースト表示になる（アラートではない）

    // エクスポートボタン押下
    const btn = page.getByRole('button', { name: /PPTXエクスポート|エクスポート/ });
    await btn.click();

    // ポーリング1回分待機
    await page.waitForTimeout(1100);

    // 失敗トーストが表示される
    const toast = page.getByText(/エクスポートに失敗しました|error/i);
    await expect(toast).toBeVisible();
  });
});
