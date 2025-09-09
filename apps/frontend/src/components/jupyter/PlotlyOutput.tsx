"use client";

import { useEffect, useRef, useState } from 'react';

type PlotlyData = any;

export function PlotlyOutput({ figure }: { figure: PlotlyData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const Plotly = await import('plotly.js-dist-min');
        if (disposed) return;
        const el = ref.current!;
        const data = figure?.data || [];
        const layout = figure?.layout || {};
        await Plotly.newPlot(el, data, layout, { responsive: true });
      } catch (e: any) {
        setError(e?.message || 'Plotlyの描画に失敗しました');
      }
    })();
    return () => {
      disposed = true;
      // Plotly will auto-clean when element is removed
    };
  }, [figure]);

  if (error) return <div className="text-xs text-red-700">{error}</div>;
  return <div ref={ref} className="w-full h-[360px]" />;
}

