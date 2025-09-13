'use client';

import { useState } from 'react';
import { NotebookApi } from '@/lib/api';
import type { ParsedNotebook } from '@/types/api';

export default function ParsePage() {
  const [result, setResult] = useState<ParsedNotebook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError('ファイルを選択してください');
      setLoading(false);
      return;
    }
    try {
      const data = await NotebookApi.parseNotebook(file);
      setResult(data);
    } catch (err) {
      setError((err as Error)?.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Notebook 解析デモ</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="file" name="file" accept=".ipynb" />
        <div>
          <button type="submit" disabled={loading} className="px-3 py-1 rounded bg-black text-white disabled:opacity-50">
            {loading ? '解析中…' : '解析する'}
          </button>
        </div>
      </form>
      {error && <p className="text-red-600">{error}</p>}
      {result && (
        <section>
          <h2 className="text-xl font-semibold">{result.name}</h2>
          <ul className="mt-2 space-y-2">
            {result.cells.map((c) => (
              <li key={c.id} className="border p-2 rounded">
                <div className="text-sm text-slate-600">#{c.index} / {c.cell_type}</div>
                {c.cell_type === 'markdown' && <pre className="whitespace-pre-wrap text-sm">{c.source}</pre>}
                {c.cell_type === 'code' && (
                  <div className="mt-2">
                    <pre className="whitespace-pre-wrap text-sm">{c.source}</pre>
                    {c.outputs?.length ? (
                      <div className="mt-1 text-xs text-slate-700">outputs: {c.outputs.map(o => o.text).filter(Boolean).join(' | ')}</div>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
