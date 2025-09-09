// Minimal stub for prom-client used only in tests
export class Registry {
  metrics(): string { return ''; }
}

export class Counter<T = any> {
  constructor(_opts: any) {}
  inc(_v?: number): void {}
  labels(_label?: string): any { return this; }
}

export class Histogram<T = any> {
  constructor(_opts: any) {}
  observe(_v: number): void {}
}

export function collectDefaultMetrics(_opts?: any): void {}

