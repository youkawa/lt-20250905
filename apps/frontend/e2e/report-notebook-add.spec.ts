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
    // Mock API endpoints used by page except notebook parse (we will intercept the upload and fulfill directly)
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

    // Intercept Notebook parse endpoint (multipart)
    await page.route('**/parse', async (route, req) => {
      const { pathname } = new URL(req.url());
      if (pathname !== '/parse') return route.fallback();
      // Return parsed notebook JSON expected by UI
      return route.fulfill({ json: {
        name: 'sample.ipynb',
        cells: [
          { id: 'c1', index: 0, cell_type: 'markdown', source: '# Heading', outputs: [], origin: {} },
          { id: 'c2', index: 1, cell_type: 'code', source: 'print(1)', outputs: [{output_type:'stream', text:'1'}], origin: {} },
        ],
      }});
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
    await expect(page.getByText('Heading')).toBeVisible();
  });
});
