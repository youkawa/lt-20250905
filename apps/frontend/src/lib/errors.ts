import { ApiError } from './http';

export function toDisplayMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return '不明なエラーが発生しました';
}

