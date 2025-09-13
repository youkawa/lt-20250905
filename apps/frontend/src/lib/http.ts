import { apiConfig } from './config';

type JsonBody = Record<string, unknown> | unknown[];

export class ApiError extends Error {
  status: number;
  payload?: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function withTimeout(options: RequestInit, timeoutMs: number): { options: RequestInit; controller: AbortController } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const clean = () => clearTimeout(timer);
  // Ensure cleanup when signal aborts naturally
  controller.signal.addEventListener('abort', clean, { once: true });
  return { options: { ...options, signal: controller.signal }, controller };
}

async function doFetch(url: string, options: RequestInit): Promise<Response> {
  const { options: timedOptions, controller } = withTimeout(options, apiConfig.timeoutMs);
  try {
    return await fetch(url, timedOptions);
  } finally {
    controller.abort();
  }
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const attempt = async (): Promise<Response> => doFetch(url, options);

  let lastErr: unknown;
  const maxAttempts = Math.max(1, apiConfig.retry + 1);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await attempt();
      return await handleResponse<T>(res);
    } catch (err) {
      lastErr = err;
      // Retry only on network errors or 5xx
      if (err instanceof ApiError) {
        if (err.status < 500) break;
      }
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 250 * Math.pow(2, i)));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data: unknown = isJson ? await res.json().catch(() => undefined) : await res.text();
  if (!res.ok) {
    const message = (isJson && typeof data === 'object' && data && 'detail' in data
      ? String((data as { detail?: unknown }).detail)
      : res.statusText) || 'Request failed';
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

export function jsonOptions(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: JsonBody,
  headers?: HeadersInit,
): RequestInit {
  const h: HeadersInit = { 'Content-Type': 'application/json', ...(headers || {}) };
  return { method, headers: h, body: body ? JSON.stringify(body) : undefined };
}
