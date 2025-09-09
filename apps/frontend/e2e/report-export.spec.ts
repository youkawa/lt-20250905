import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - PPTX export', () => {
  test('loads report, autosaves title, exports PPTX and shows download link', async ({ page }) => {
    // API routes mock
    await page.route('**/reports/r1', async (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({ json: { id: 'r1', projectId: 'p1', title: 'Report', content: [] } });
      }
      if (request.method() === 'PATCH') {
        const body = await request.postDataJSON();
        return route.fulfill({ json: { id: 'r1', projectId: 'p1', title: body.title ?? 'Report', content: body.content ?? [] } });
      }
      return route.fallback();
    });
    await page.route('**/projects/p1/reports**', (route) => route.fulfill({ json: { items: [], take: 20, nextCursor: null, hasMore: false } }));
    await page.route('**/templates', (route) => route.fulfill({ json: [] }));
    await page.route('**/exports', async (route, request) => {
      if (request.method() === 'POST') return route.fulfill({ json: { jobId: 'j1', status: 'queued' } });
      return route.fallback();
    });
    // export-jobs: 1回目 processing, 2回目 completed
    let poll = 0;
    await page.route('**/export-jobs/j1', async (route) => {
      poll++;
      if (poll < 2) return route.fulfill({ json: { jobId: 'j1', status: 'processing' } });
      return route.fulfill({ json: { jobId: 'j1', status: 'completed', downloadUrl: '/exports/j1.pptx' } });
    });

    await page.goto('/projects/p1/reports/r1');
    // タイトルが読み込まれる
    const title = page.getByRole('textbox');
    await expect(title).toHaveValue('Report');
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
    await expect(link).toHaveAttribute('href', 'http://notebook/exports/j1.pptx');
  });
});
