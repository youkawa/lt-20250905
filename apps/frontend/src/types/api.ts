// Shared API-facing types (frontend-side)

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportContentItem = Record<string, unknown>; // 最小限の安全な表現（後続で詳細化）

export interface Report {
  id: string;
  projectId: string;
  title: string;
  version: number;
  content: ReportContentItem[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CursorPage<T> {
  items: T[];
  cursor?: string;
  nextCursor?: string;
  take: number;
  hasMore: boolean;
}

// Notebook parse result
export type ParsedNotebook = {
  name: string;
  cells: Array<
    | { id: string; index: number; cell_type: 'markdown'; source: string }
    | {
        id: string;
        index: number;
        cell_type: 'code';
        source: string;
        outputs: Array<{
          output_type: string;
          text?: string;
          data?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        }>;
      }
  >;
};
