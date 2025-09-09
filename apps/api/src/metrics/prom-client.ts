// Runtime wrapper for prom-client: use real module if available, otherwise provide a no-op stub.
// This file uses ES exports so TypeScript treats it as a module.

type CtorArg = any;

class StubRegistry { metrics(): string { return ''; } }
class StubCounter<T = any> { constructor(_opts: CtorArg) {} inc(_v?: number): void {} labels(_l?: string): any { return this; } }
class StubHistogram<T = any> { constructor(_opts: CtorArg) {} observe(_v: number): void {} }
function stubCollectDefaultMetrics(_opts?: any): void {}

// Default to stubs
let _Registry: any = StubRegistry;
let _Counter: any = StubCounter;
let _Histogram: any = StubHistogram;
let _collectDefaultMetrics: any = stubCollectDefaultMetrics;

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

export const Registry = _Registry as new (...args: any[]) => any;
export const Counter = _Counter as new (...args: any[]) => any;
export const Histogram = _Histogram as new (...args: any[]) => any;
export const collectDefaultMetrics = _collectDefaultMetrics as (...args: any[]) => any;
