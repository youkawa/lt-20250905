export const apiConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  notebookBaseUrl:
    process.env.NEXT_PUBLIC_NOTEBOOK_BASE_URL || 'http://localhost:8000',
  userId: process.env.NEXT_PUBLIC_USER_ID || '',
  jwt: process.env.NEXT_PUBLIC_JWT || '',
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || '15000'),
  retry: Number(process.env.NEXT_PUBLIC_API_RETRY || '1'),
} as const;

export function buildAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (apiConfig.jwt) headers['Authorization'] = `Bearer ${apiConfig.jwt}`;
  if (apiConfig.userId) headers['X-User-Id'] = apiConfig.userId;
  return headers;
}
