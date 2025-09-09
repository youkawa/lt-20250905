import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'p1', reportId: 'r1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const startMock = vi.fn(async () => ({ jobId: 'jpdf', status: 'queued' }));
let pollCount = 0;
const pollMock = vi.fn(async () => {
  pollCount++;
  if (pollCount < 2) return { jobId: 'jpdf', status: 'processing' };
  return { jobId: 'jpdf', status: 'completed', downloadUrl: '/exports/jpdf.pdf' };
});

vi.mock('@/lib/api', () => ({
  ReportsApi: {
    get: vi.fn(async () => ({ id: 'r1', projectId: 'p1', title: 'Report', content: [] })),
    update: vi.fn(async () => ({ ok: true })),
  },
  TemplatesApi: { list: vi.fn(async () => []) },
  ExportApi: { start: startMock },
  ExportJobsApi: { get: pollMock },
}));

import Page from './page';

describe('ReportDetailPage PDF export', () => {
  beforeEach(() => {
    pollCount = 0;
    vi.useFakeTimers();
    (process.env as any).NEXT_PUBLIC_NOTEBOOK_BASE_URL = 'http://notebook';
  });
  afterEach(() => vi.useRealTimers());

  it('exports as PDF and shows pdf link', async () => {
    render(<Page />);
    await screen.findByDisplayValue('Report');
    const formatSelect = screen.getByDisplayValue('PPTX') as HTMLSelectElement;
    fireEvent.change(formatSelect, { target: { value: 'pdf' } });
    const btn = await screen.findByRole('button', { name: 'PDFエクスポート' });
    fireEvent.click(btn);
    await vi.advanceTimersByTimeAsync(1100);
    await vi.advanceTimersByTimeAsync(1100);
    await waitFor(() => expect(screen.getByText('生成ファイルをダウンロード')).toBeInTheDocument());
    const link = screen.getByText('生成ファイルをダウンロード').closest('a')!;
    expect(link.getAttribute('href')).toBe('http://notebook/exports/jpdf.pdf');
  });
});

