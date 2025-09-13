import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - PPTX export', () => {
  test('loads report, autosaves title, exports PPTX and shows download link', async ({ page }) => {
    // 安定化: fetch をパッチして API をスタブ
    await page.addInitScript(() => {
      const original = window.fetch;
      let patchCount = 0;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') {
          return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/reports/r1')) {
          if (method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          if (method === 'PATCH') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Quarterly Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/exports') && method === 'POST') {
          return new Response(JSON.stringify({ jobId: 'j1', status: 'queued' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (url.endsWith('/export-jobs/j1')) {
          patchCount++;
          if (patchCount < 2) return new Response(JSON.stringify({ jobId: 'j1', status: 'processing' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          return new Response(JSON.stringify({ jobId: 'j1', status: 'completed', downloadUrl: '/exports/j1.pptx' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');
    // タイトルが読み込まれる
    await expect(page.getByText('レポート編集')).toBeVisible();
    const title = page.locator('input[type="text"]');
    await expect(title.first()).toHaveValue('Report');
    // タイトル変更で自動保存(PATCH)が投げられる
    await title.fill('Quarterly Report');
    // UIの「保存済み」表示を待つ
    await expect(page.getByText(/保存済み/)).toBeVisible();

    // エクスポート実行
    const btn = page.getByRole('button', { name: 'PPTXエクスポート' });
    await btn.click();
    // ポーリング2回分（1秒間隔）。setTimeout を待機
    await page.waitForTimeout(1200);
    await page.waitForTimeout(1200);
    // ダウンロードリンク表示
    const link = page.getByRole('link', { name: '生成ファイルをダウンロード' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /http:\/\/(notebook|localhost:8000)\/exports\/j1\.pptx/);
  });
});
