'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Report } from '@/types/api';
import { ReportsApi, ExportApi, ExportJobsApi, TemplatesApi } from '@/lib/api';
import { useAutoSave } from '@/lib/hooks';
import { toDisplayMessage } from '@/lib/errors';
import { ReportCanvas } from '@/components/editor/ReportCanvas';
import { NotebookSelectorPanel } from '@/components/editor/NotebookSelectorPanel';
import { PreviewPanel } from '@/components/editor/PreviewPanel';
import { Toast } from '@/components/core/Toast';

type ContentItem = any; // Report.content の簡易表現

export default function ReportDetailPage() {
  const params = useParams<{ id: string; reportId: string }>();
  const projectId = params?.id as string;
  const reportId = params?.reportId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [base, setBase] = useState<Report | null>(null);

  const titleAuto = useAutoSave('', async (title) => {
    if (!reportId) return;
    await ReportsApi.update(reportId, { title });
  });
  const contentAuto = useAutoSave<ContentItem[]>([], async (content) => {
    if (!reportId) return;
    await ReportsApi.update(reportId, { content });
  });

  useEffect(() => {
    async function run() {
      setLoading(true);
      setLoadError(null);
      try {
        const rep = await ReportsApi.get(reportId);
        setBase(rep);
        titleAuto.setValue(rep.title);
        contentAuto.setValue((rep.content as any[]) || []);
      } catch (e) {
        setLoadError(toDisplayMessage(e));
      } finally {
        setLoading(false);
      }
    }
    if (reportId) run();
  }, [reportId]);

  const statusText = useMemo(() => {
    if (titleAuto.saving || contentAuto.saving) return '保存中…';
    if (titleAuto.error || contentAuto.error) return titleAuto.error || contentAuto.error;
    if (titleAuto.savedAt || contentAuto.savedAt)
      return `保存済み: ${new Date((contentAuto.savedAt || titleAuto.savedAt)!).toLocaleTimeString()}`;
    return '';
  }, [titleAuto.saving, contentAuto.saving, titleAuto.error, contentAuto.error, titleAuto.savedAt, contentAuto.savedAt]);

  const [parsedCells, setParsedCells] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobInfo, setJobInfo] = useState<any | null>(null);
  const [errorInfo, setErrorInfo] = useState<{ code?: string; message?: string } | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [tplLoading, setTplLoading] = useState(false);
  const [format, setFormat] = useState<'pptx' | 'pdf'>('pptx');

  useEffect(() => {
    const fetchTemplates = async () => {
      setTplLoading(true);
      try {
        const list = await TemplatesApi.list();
        setTemplates(list);
        // 初期値: 既定があればそれを選択
        const def = list.find((t: any) => t?.content?.isDefault);
        if (def) setTemplateId(def.id);
      } catch (_) {
        // non-adminの場合は一覧取得に失敗する可能性があるが、黙って無視
      } finally {
        setTplLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const addCellToContent = (cell: any) => {
    const item: any =
      cell.cell_type === 'markdown'
        ? { type: 'notebook_markdown', source: cell.source }
        : { type: 'notebook_code', source: cell.source, outputs: cell.outputs };
    contentAuto.update((prev) => [...prev, item]);
  };

  const onExport = async () => {
    if (!base) return;
    setExporting(true);
    setDownloadUrl(null);
    try {
      const start = await ExportApi.start({
        title: titleAuto.value || base.title,
        content: contentAuto.value,
        metadata: { projectId, reportId },
        templateId: templateId || undefined,
        format,
      });
      let job = await ExportJobsApi.get(start.jobId);
      setJobInfo(job);
      for (let i = 0; i < 60 && job.status !== 'completed' && job.status !== 'failed'; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        job = await ExportJobsApi.get(start.jobId);
        setJobInfo(job);
      }
      if (job.status === 'completed' && job.downloadUrl) {
        setDownloadUrl(`${process.env.NEXT_PUBLIC_NOTEBOOK_BASE_URL || 'http://localhost:8000'}${job.downloadUrl}`);
        setErrorInfo(null);
      } else {
        const code = (job as any)?.errorCode as string | undefined;
        const msg = (job as any)?.error as string | undefined;
        setErrorInfo({ code, message: humanizeErrorCode(code, msg) });
      }
    } catch (err) {
      alert(toDisplayMessage(err));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <main className="p-8">読み込み中…</main>;
  if (loadError) return <main className="p-8 text-red-600">{loadError}</main>;
  if (!base) return null;

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レポート編集</h1>
        <Link className="text-blue-600 underline" href={`/projects/${projectId}/reports`}>
          ← レポート一覧へ
        </Link>
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-slate-700">タイトル</label>
        <input
          type="text"
          value={titleAuto.value}
          onChange={(e) => titleAuto.setValue(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">コンテンツ</div>
          <div className="text-sm text-slate-600">{statusText}</div>
        </div>
        <ReportCanvas
          items={contentAuto.value}
          onReorder={(next) => contentAuto.setValue(next as any)}
          onRemove={(idx) => contentAuto.update((prev) => prev.filter((_, i) => i !== idx))}
        />
      </div>

      <NotebookSelectorPanel
        onAddCell={(c, notebookName) => {
          const base =
            c.cell_type === 'markdown'
              ? { type: 'notebook_markdown', source: (c as any).source }
              : { type: 'notebook_code', source: (c as any).source, outputs: (c as any).outputs };
          const item: any = { ...base, origin: { notebookName, cellIndex: (c as any).index } };
          contentAuto.update((prev) => [...prev, item]);
        }}
      />

      <section className="space-y-2">
        <div className="font-semibold">テキストの追加</div>
        <TextAdder onAdd={(html) => contentAuto.update((prev) => [...prev, { type: 'text_box', content: html }])} />
      </section>

      <section className="space-y-2">
        <div className="font-semibold">テンプレート</div>
        {tplLoading ? (
          <div className="text-sm text-slate-600">テンプレート読込中…</div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              className="border rounded px-2 py-1 w-80"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">未選択（テンプレートなし）</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.title} v{t.version}{t?.content?.isDefault ? '（既定）' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="font-semibold">エクスポート</div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-700">形式</label>
          <select className="border rounded px-2 py-1" value={format} onChange={(e) => setFormat(e.target.value as any)}>
            <option value="pptx">PPTX</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <button
          onClick={onExport}
          disabled={exporting}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
        >
          {exporting ? 'エクスポート中…' : format === 'pdf' ? 'PDFエクスポート' : 'PPTXエクスポート'}
        </button>
        {errorInfo && (
          <Toast
            title="エクスポートに失敗しました"
            message={errorInfo.message || 'エラーが発生しました'}
            detail={tipForErrorCode(errorInfo.code)}
            onClose={() => setErrorInfo(null)}
            actions={[{
              label: '再試行',
              onClick: () => {
                setDownloadUrl(null);
                setJobInfo(null);
                setErrorInfo(null);
                onExport();
              },
            }]}
            duration={8000}
          />
        )}
        {jobInfo && (
          <div className="text-sm text-slate-700 space-x-3 mt-1">
            {typeof jobInfo.progress === 'number' && <span>進捗: {Math.round(jobInfo.progress)}%</span>}
            {(jobInfo.attemptsMade || jobInfo.attemptsMax) && (
              <span>試行: {jobInfo.attemptsMade ?? 0}/{jobInfo.attemptsMax ?? '?'}</span>
            )}
            {typeof jobInfo.durationMs === 'number' && (
              <span>所要: {(jobInfo.durationMs / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}
        {downloadUrl && (
          <div>
            <a className="text-blue-700 underline" href={downloadUrl} target="_blank" rel="noreferrer">
              生成ファイルをダウンロード
            </a>
          </div>
        )}
      </section>

      <PreviewPanel items={contentAuto.value} />
    </main>
  );
}

function humanizeErrorCode(code?: string, msg?: string) {
  const m = {
    TIMEOUT: 'タイムアウトしました。しばらくして再試行してください。',
    NETWORK_ERROR: 'ネットワークエラーが発生しました。',
    REMOTE_FAILED: 'エクスポートサービスが失敗を返しました。',
  } as Record<string, string>;
  if (code && m[code]) return m[code];
  if (code && code.startsWith('HTTP_') && /HTTP_\d{3}/.test(code)) return `エクスポートサービスがエラー応答(${code.replace('HTTP_', '')})を返しました。`;
  return msg || '不明なエラー';
}

function tipForErrorCode(code?: string) {
  if (!code) return 'もう一度お試しください。問題が続く場合は管理者に連絡してください。';
  if (code === 'TIMEOUT' || code === 'NETWORK_ERROR') return 'ネットワーク状況を確認し、しばらく待ってから再試行してください。';
  if (code === 'REMOTE_FAILED') return '入力内容やテンプレートを見直し、再度お試しください。';
  if (code === 'HTTP_5XX') return 'サーバ側の一時的な問題の可能性があります。時間をおいて再試行してください。';
  if (code === 'HTTP_4XX') return '入力データや権限に問題がある可能性があります。内容を確認してください。';
  if (code.startsWith('HTTP_')) return 'サーバからエラーが返りました。時間をおいて再試行してください。';
  return 'もう一度お試しください。問題が続く場合は管理者に連絡してください。';
}

function TextAdder({ onAdd }: { onAdd: (html: string) => void }) {
  const [value, setValue] = useState<string>("");
  return (
    <div className="space-y-2">
      <textarea
        className="w-full border rounded p-2 min-h-[120px]"
        placeholder="HTML を入力（簡易）"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-600">安全のため、生HTMLは開発段階のみ</div>
        <button
          className="px-3 py-1 rounded bg-slate-700 text-white disabled:opacity-50"
          disabled={!value.trim()}
          onClick={() => {
            onAdd(value);
            setValue("");
          }}
        >
          追加
        </button>
      </div>
    </div>
  );
}
