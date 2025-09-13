// Minimal stub for prom-client used only in tests
export class Registry {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  metrics(): string { return ''; }
}

export class Counter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_opts: unknown) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  inc(_v?: number): void {}
  labels(_label?: string): Counter { return this; }
}

export class Histogram {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_opts: unknown) {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe(_v: number): void {}
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function collectDefaultMetrics(_opts?: unknown): void {}
