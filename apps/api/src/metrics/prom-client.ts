/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Runtime wrapper for prom-client: use real module if available, otherwise provide a no-op stub.
// This file uses ES exports so TypeScript treats it as a module.

type CtorArg = unknown;

class StubRegistry { metrics(): string { return ''; } }
class StubCounter { constructor(_opts: CtorArg) {} inc(_v?: number): void {} labels(_l?: string): StubCounter { return this; } }
class StubHistogram { constructor(_opts: CtorArg) {} observe(_v: number): void {} }
function stubCollectDefaultMetrics(_opts?: unknown): void {}

// Default to stubs
let _Registry: unknown = StubRegistry;
let _Counter: unknown = StubCounter;
let _Histogram: unknown = StubHistogram;
let _collectDefaultMetrics: unknown = stubCollectDefaultMetrics;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const real = require('prom-client');
  if (real?.Registry) _Registry = real.Registry;
  if (real?.Counter) _Counter = real.Counter;
  if (real?.Histogram) _Histogram = real.Histogram;
  if (real?.collectDefaultMetrics) _collectDefaultMetrics = real.collectDefaultMetrics;
} catch {
  // keep stubs
}

export const Registry = _Registry as new (...args: unknown[]) => any;
export const Counter = _Counter as new (...args: unknown[]) => any;
export const Histogram = _Histogram as new (...args: unknown[]) => any;
export const collectDefaultMetrics = _collectDefaultMetrics as (...args: unknown[]) => any;
