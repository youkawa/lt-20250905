import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - DnD reorder', () => {
  test('drag handle moves first item to last', async ({ page }) => {
    // Prepare report with three text_box items A,B,C
    await page.addInitScript(() => {
      const original = window.fetch;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [
          { type: 'text_box', content: '<p>A</p>' },
          { type: 'text_box', content: '<p>B</p>' },
          { type: 'text_box', content: '<p>C</p>' },
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');

    // 3つの項目が見える（リスト内で検証）
    await expect(page.getByText('レポート編集')).toBeVisible();
    const itemsList = page.locator('ul > li');
    await expect(itemsList).toHaveCount(3);

    // 1つ目の「並替」ハンドルを3つ目の位置までドラッグ
    const handles = page.getByRole('button', { name: 'ドラッグで並べ替え' });
    const first = await handles.nth(0).boundingBox();
    const third = await handles.nth(2).boundingBox();
    if (!first || !third) throw new Error('handle not found');
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(third.x + third.width / 2, third.y + third.height / 2, { steps: 8 });
    await page.mouse.up();

    // 表示順が B, C, A になることを確認
    const texts = await itemsList.allInnerTexts();
    // innerText には番号なども含まれるため、A/B/C の出現順で判定
    const joined = texts.join(' | ');
    const idxA = joined.indexOf('A');
    const idxB = joined.indexOf('B');
    const idxC = joined.indexOf('C');
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(idxC).toBeGreaterThan(idxB);
    expect(idxA).toBeGreaterThan(idxC);
  });
});
