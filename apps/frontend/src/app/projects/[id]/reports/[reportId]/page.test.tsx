import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next/navigation for useParams/useRouter
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'p1', reportId: 'r1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock API module
const startMock = vi.fn(async () => ({ jobId: 'j1', status: 'queued' }));
let pollCount = 0;
const pollMock = vi.fn(async () => {
  pollCount++;
  if (pollCount < 2) return { jobId: 'j1', status: 'processing' };
  return { jobId: 'j1', status: 'completed', downloadUrl: '/exports/j1.pptx' };
});

vi.mock('@/lib/api', () => ({
  ReportsApi: {
    get: vi.fn(async () => ({ id: 'r1', projectId: 'p1', title: 'Report', content: [] })),
    update: vi.fn(async () => ({ ok: true })),
  },
  TemplatesApi: {
    list: vi.fn(async () => []),
  },
  ExportApi: {
    start: startMock,
  },
  ExportJobsApi: {
    get: pollMock,
  },
}));

import Page from './page';

describe('ReportDetailPage export polling UI', () => {
  beforeEach(() => {
    pollCount = 0;
    vi.useFakeTimers();
    (process.env as any).NEXT_PUBLIC_NOTEBOOK_BASE_URL = 'http://notebook';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows download link after polling completes', async () => {
    render(<Page />);
    // wait for page to load title input
    await screen.findByDisplayValue('Report');
    const btn = await screen.findByRole('button', { name: 'PPTXエクスポート' });
    fireEvent.click(btn);
    // advance polling (1 second)
    await vi.advanceTimersByTimeAsync(1100);
    // another tick to reach completed
    await vi.advanceTimersByTimeAsync(1100);
    await waitFor(() => expect(screen.getByText('生成ファイルをダウンロード')).toBeInTheDocument());
    const link = screen.getByText('生成ファイルをダウンロード').closest('a')!;
    expect(link.getAttribute('href')).toBe('http://notebook/exports/j1.pptx');
  });
});

