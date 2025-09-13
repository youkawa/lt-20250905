"use client";

import { useState } from 'react';

import { NotebookApi } from '@/lib/api';
import { toDisplayMessage } from '@/lib/errors';
import { markdownToSafeHtml } from '@/lib/markdown';
import type { ParsedNotebook } from '@/types/api';

export function NotebookSelectorPanel({
  onAddCell,
}: {
  onAddCell: (cell: ParsedNotebook['cells'][number], notebookName: string) => void;
}) {
  const [parsed, setParsed] = useState<ParsedNotebook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await NotebookApi.parseNotebook(file);
      setParsed(res);
    } catch (err) {
      setError(toDisplayMessage(err));
    } finally {
      setLoading(false);
      e.currentTarget.value = '';
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Notebook から追加</div>
        <input type="file" accept=".ipynb" onChange={onUpload} />
      </div>
      {loading && <p>解析中…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {parsed && (
        <div className="border rounded p-3">
          <div className="text-sm text-slate-700 mb-2">{parsed.name}（クリックで追加）</div>
          <ul className="space-y-2 max-h-64 overflow-auto">
            {parsed.cells.map((c) => (
              <li key={`${c.id}-${c.index}`} className="border rounded p-2">
                <div className="text-xs text-slate-600">#{c.index} / {c.cell_type}</div>
                {c.cell_type === 'markdown' ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(c.source || '') }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-2 rounded border">{c.source}</pre>
                )}
                <div className="mt-1">
                  <button
                    className="text-sm text-blue-700 hover:underline"
                    onClick={() => onAddCell(c, parsed.name)}
                  >
                    追加
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
