import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('buildAuthHeaders', () => {
  const orig = { ...process.env } as any;
  beforeEach(() => {
    jestResetEnv();
  });
  afterEach(() => {
    process.env = { ...orig };
  });

  function jestResetEnv() {
    for (const k of Object.keys(process.env)) {
      if (k.startsWith('NEXT_PUBLIC_')) delete (process.env as any)[k];
    }
  }

  it('includes Authorization when NEXT_PUBLIC_JWT provided', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://example';
    process.env.NEXT_PUBLIC_JWT = 'token123';
    const { buildAuthHeaders } = await import('./config');
    const h = buildAuthHeaders() as Record<string, string>;
    expect(h['Authorization']).toBe('Bearer token123');
  });

  it('falls back to X-User-Id when provided', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://example';
    process.env.NEXT_PUBLIC_USER_ID = 'alice';
    const { buildAuthHeaders } = await import('./config');
    const h = buildAuthHeaders() as Record<string, string>;
    expect(h['X-User-Id']).toBe('alice');
  });
});

