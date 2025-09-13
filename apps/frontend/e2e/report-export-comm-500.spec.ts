import { test, expect } from '@playwright/test';

test.describe('Report Editor E2E - export 500 error', () => {
  test('alerts on 500 from export-jobs', async ({ page }) => {
    await page.addInitScript(() => {
      const original = window.fetch;
      // @ts-ignore
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        const method = (init && init.method) || 'GET';
        if (url.endsWith('/templates') && method === 'GET') return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'GET') return new Response(JSON.stringify({ id: 'r1', projectId: 'p1', title: 'Report', content: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/reports/r1') && method === 'PATCH') return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/exports') && method === 'POST') return new Response(JSON.stringify({ jobId: 'jE', status: 'queued' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        if (url.endsWith('/export-jobs/jE')) return new Response('down', { status: 500 });
        return original(input as any, init);
      };
    });

    await page.goto('/projects/p1/reports/r1');
    const dialogs: string[] = [];
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });

    await page.getByRole('button', { name: /PPTXエクスポート|エクスポート/ }).click();
    await page.waitForTimeout(1100);

    await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    expect(dialogs.join(' ')).toMatch(/失敗|failed|500/i);
  });
});
