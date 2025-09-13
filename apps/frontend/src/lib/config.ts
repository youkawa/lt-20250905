export function getApiConfig() {
  return {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    notebookBaseUrl:
      process.env.NEXT_PUBLIC_NOTEBOOK_BASE_URL || 'http://localhost:8000',
    userId: process.env.NEXT_PUBLIC_USER_ID || '',
    jwt: process.env.NEXT_PUBLIC_JWT || '',
    timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || '15000'),
    retry: Number(process.env.NEXT_PUBLIC_API_RETRY || '1'),
  } as const;
}

// 既存のモジュール利用（api.ts等）との後方互換
export const apiConfig = getApiConfig();

export function buildAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  const cfg = getApiConfig();
  if (cfg.jwt) headers['Authorization'] = `Bearer ${cfg.jwt}`;
  if (cfg.userId) headers['X-User-Id'] = cfg.userId;
  return headers;
}
