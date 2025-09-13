"use client";

import { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import { PlotlyOutput } from './PlotlyOutput';
import type { CodeOutput } from '@/types/api';

type JupyterModule = { Output?: ComponentType<{ output: CodeOutput }> } | null;

export function JupyterOutput({ output }: { output: CodeOutput }) {
  const [Jupyter, setJupyter] = useState<JupyterModule>(null);
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = (await import('@datalayer/jupyter-ui')) as JupyterModule;
        if (!mounted) return;
        setJupyter(mod);
        // Heuristic: if module exports Output component, try to use it
        setCanRender(!!mod?.Output);
      } catch (_) {
        setCanRender(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const hasImagePng = !!output.data?.['image/png'];
  const hasPlotly = !!output.data?.['application/vnd.plotly.v1+json'];

  const content = useMemo(() => {
    if (canRender && Jupyter?.Output) {
      try {
        const O = Jupyter.Output as ComponentType<{ output: CodeOutput }>;
        // Many Jupyter UI wrappers accept a classic nbformat-like output object
        return (
          <Suspense fallback={<div className="text-xs text-slate-500">loading…</div>}>
            <O output={output} />
          </Suspense>
        );
      } catch (_) {
        // fall back to manual rendering
      }
    }

    if (hasImagePng) {
      const b64 = output.data?.['image/png'] as string;
      return (
        <img alt="output" className="max-w-full h-auto" src={`data:image/png;base64,${b64}`} />
      );
    }
    if (hasPlotly) {
      return <PlotlyOutput figure={output.data?.['application/vnd.plotly.v1+json']} />;
    }
    if (output.text) {
      return <pre className="whitespace-pre-wrap text-xs">{output.text}</pre>;
    }
    return null;
  }, [Jupyter, canRender, hasImagePng, hasPlotly, output]);

  return <div>{content}</div>;
}
