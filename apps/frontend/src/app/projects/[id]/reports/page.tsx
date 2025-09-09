'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Report } from '@/types/api';
import { ReportsApi } from '@/lib/api';

export default function ProjectReportsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id as string;
  const search = useSearchParams();
  const pageFromQuery = Number(search.get('page') || '1');
  const router = useRouter();

  const [page, setPage] = useState<number>(pageFromQuery > 0 ? pageFromQuery : 1);
  const [pageSize] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Report[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useEffect(() => {
    const qp = new URLSearchParams(Array.from(search.entries()));
    qp.set('page', String(page));
    router.replace(`?${qp.toString()}`);
  }, [page]);

  useEffect(() => {
    async function run() {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        const res = (await ReportsApi.listByProject(projectId, { page, pageSize })) as any;
        setItems(res.items);
        setTotal(res.total);
      } catch (e: any) {
        setError(e.message || '取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [projectId, page, pageSize]);

  const onCreate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const rep = await ReportsApi.create({ projectId, title: title.trim(), content: [] });
      // 最新が先頭に来るように、ページ1に移動し直す
      setPage(1);
      setItems((prev) => [rep, ...prev]);
      setTitle('');
    } catch (e: any) {
      setError(e.message || '作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">レポート一覧</h1>
        <Link className="text-blue-600 underline" href="/projects">
          ← プロジェクト一覧へ
        </Link>
      </div>

      <form onSubmit={onCreate} className="flex gap-2 items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新規レポートのタイトル"
          className="border rounded px-2 py-1"
        />
        <button
          type="submit"
          disabled={creating}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
        >
          {creating ? '作成中…' : '作成'}
        </button>
      </form>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>読み込み中…</p>}

      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">
                <Link className="text-blue-600 underline" href={`/projects/${projectId}/reports/${r.id}`}>
                  {r.title}
                </Link>
              </div>
              <div className="text-xs text-slate-600">v{r.version} / {new Date(r.createdAt).toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          前へ
        </button>
        <span className="text-sm text-slate-700">
          {page} / {maxPage}（全{total}件）
        </span>
        <button
          disabled={page >= maxPage}
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </main>
  );
}
