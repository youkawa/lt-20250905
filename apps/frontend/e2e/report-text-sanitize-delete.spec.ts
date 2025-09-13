import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - text add/sanitize/delete', () => {
  test('adds text, sanitizes HTML, deletes item', async ({ page }) => {
    // Mock report load/update
    await page.addInitScript(() => {
      const original = window.fetch;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');

    // TextAdder に危険なHTMLを入力
    await expect(page.getByText('レポート編集')).toBeVisible();
    const textarea = page.locator('textarea');
    await textarea.fill('<p>Safe</p><script>alert(1)</script><img src=x onerror=alert(2) />');
    await page.getByRole('button', { name: '追加' }).click();

    // Canvas に表示される（テキスト type）
    const safeInList = page.locator('ul >> text=Safe');
    await expect(safeInList.first()).toBeVisible();
    // サニタイズ: 追加したアイテム内には script/img がない
    const item = page.locator('ul > li', { hasText: 'Safe' }).first();
    await expect(item).toBeVisible();
    expect(await item.locator('script').count()).toBe(0);
    expect(await item.locator('img').count()).toBe(0);

    // 削除ボタンでアイテムを削除
    await page.getByRole('button', { name: '削除' }).click();
    await expect(page.getByText('Safe')).toHaveCount(0);
  });
});
