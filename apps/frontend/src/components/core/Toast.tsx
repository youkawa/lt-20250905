"use client";

import { useEffect } from 'react';

export function Toast({
  title,
  message,
  detail,
  onClose,
  actions,
  duration = 8000,
}: {
  title?: string;
  message: string;
  detail?: string;
  onClose?: () => void;
  actions?: { label: string; onClick: () => void }[];
  duration?: number;
}) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm shadow-lg border rounded bg-white">
      <div className="p-3 border-b bg-red-600 text-white rounded-t">
        <div className="flex items-center justify-between gap-4">
          <div className="font-semibold text-sm">{title || 'エラー'}</div>
          <button className="text-white/90 hover:text-white text-xs" onClick={onClose} aria-label="閉じる">×</button>
        </div>
      </div>
      <div className="p-3 text-sm">
        <div className="text-red-700 font-medium">{message}</div>
        {detail && <div className="text-slate-600 mt-1 text-xs leading-relaxed">{detail}</div>}
        {actions && actions.length > 0 && (
          <div className="mt-2 flex gap-2">
            {actions.map((a, i) => (
              <button key={i} onClick={a.onClick} className="px-2 py-1 text-xs border rounded bg-white hover:bg-slate-50">
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

