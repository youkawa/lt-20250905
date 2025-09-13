import { test, expect } from '@playwright/test';

function makeIpynb() {
  return Buffer.from(JSON.stringify({
    cells: [
      { cell_type: 'markdown', source: '# Title' },
      { cell_type: 'code', execution_count: 1, source: 'print(1)', outputs: [{output_type:'stream', text:'1\n'}] },
    ],
    metadata: {}, nbformat: 4, nbformat_minor: 2,
  }), 'utf-8');
}

test.describe('Report Editor E2E - notebook cell add', () => {
  test('uploads .ipynb, shows cells, adds to canvas', async ({ page }) => {
    // 安定化: fetch パッチで API をスタブ
    await page.addInitScript(() => {
      const original = window.fetch;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/parse') && method === 'POST') return new Response(JSON.stringify({ name: 'sample.ipynb', cells: [ { id: 'c1', index: 0, cell_type: 'markdown', source: '# Heading', outputs: [], origin: {} }, { id: 'c2', index: 1, cell_type: 'code', source: 'print(1)', outputs: [{ output_type: 'stream', text: '1' }], origin: {} } ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');
    // ファイル選択してアップロード
    const fileInput = page.locator('input[type="file"][accept=".ipynb"]');
    await fileInput.setInputFiles({ name: 'nb.ipynb', mimeType: 'application/json', buffer: makeIpynb() });

    // セルリストが出る→「追加」をクリック
    await expect(page.getByText('sample.ipynb')).toBeVisible();
    const addButtons = page.getByRole('button', { name: '追加' });
    await addButtons.first().click();

    // Canvas に notebook_markdown が追加され、プレビューが表示（Heading のテキスト）
    const headingInList = page.locator('ul >> h1:has-text("Heading")');
    await expect(headingInList.first()).toBeVisible();
  });
});
