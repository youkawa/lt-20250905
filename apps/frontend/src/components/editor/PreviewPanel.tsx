"use client";

import { markdownToSafeHtml } from '@/lib/markdown';
import { JupyterOutput } from '@/components/jupyter/JupyterOutput';
import { sanitizeHtml } from '@/lib/html';
import type { ReportContentItem, CodeOutput } from '@/types/api';

export function PreviewPanel({ items }: { items: ReportContentItem[] }) {
  return (
    <section className="space-y-2">
      <div className="font-semibold">プレビュー</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((it, idx) => (
          <div key={idx} className="border rounded-md p-4 bg-white shadow-sm">
            <div className="text-xs text-slate-500 mb-2">スライド {idx + 1}</div>
            {it.origin && (
              <div className="text-xs text-slate-400 mb-2">出所: {it.origin.notebookName} / #{it.origin.cellIndex}</div>
            )}
            {it.type === 'notebook_markdown' && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(it.source || '') }}
              />
            )}
            {it.type === 'notebook_code' && (
              <div>
                <pre className="text-sm whitespace-pre-wrap bg-slate-50 p-2 rounded border">{it.source}</pre>
                {Array.isArray(it.outputs) && it.outputs.length > 0 && (
                  <div className="text-xs text-slate-700 mt-2 space-y-2">
                    {it.outputs.map((o: CodeOutput, i: number) => (
                      <div key={i} className="border rounded p-2">
                        <JupyterOutput output={o} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {it.type === 'text_box' && (
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(it.content || '') }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
