import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - text add/sanitize/delete', () => {
  test('adds text, sanitizes HTML, deletes item', async ({ page }) => {
    // Mock report load/update
    await page.route('**/reports/r1', (route, req) => {
      if (req.method() === 'GET') return route.fulfill({ json: { id: 'r1', projectId: 'p1', title: 'Report', content: [] } });
      if (req.method() === 'PATCH') return route.fulfill({ json: { ok: true } });
      return route.fallback();
    });
    await page.route('**/templates', (route) => route.fulfill({ json: [] }));

    await page.goto('/projects/p1/reports/r1');

    // TextAdder に危険なHTMLを入力
    const textarea = page.locator('textarea');
    await textarea.fill('<p>Safe</p><script>alert(1)</script><img src=x onerror=alert(2) />');
    await page.getByRole('button', { name: '追加' }).click();

    // Canvas に表示される（テキスト type）
    await expect(page.getByText('Safe')).toBeVisible();
    // サニタイズ: scriptタグなし、imgタグも出力されない
    const scripts = await page.locator('script').count();
    expect(scripts).toBe(0);
    const imgs = await page.locator('img').count();
    expect(imgs).toBe(0);

    // 削除ボタンでアイテムを削除
    await page.getByRole('button', { name: '削除' }).click();
    await expect(page.getByText('Safe')).toHaveCount(0);
  });
});

