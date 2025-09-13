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
        outputs: Array<CodeOutput>;
      }
  >;
};

// Jupyter Code cell output (minimal nbformat-like)
export type CodeOutput = {
  output_type: string;
  text?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

// Templates (admin)
export type TemplateContent = {
  filename?: string;
  originalName?: string;
  isDefault?: boolean;
} & Record<string, unknown>;

export interface Template {
  id: string;
  title: string;
  version: number;
  content: TemplateContent;
  createdAt: string;
  updatedAt?: string;
}

// Report content union (frontend <-> API)
export type NotebookMarkdownItem = {
  type: 'notebook_markdown';
  source: string;
  origin?: { notebookName: string; cellIndex: number };
};

export type NotebookCodeItem = {
  type: 'notebook_code';
  source: string;
  outputs: CodeOutput[];
  origin?: { notebookName: string; cellIndex: number };
};

export type TextBoxItem = {
  type: 'text_box';
  content: string;
};

export type ReportContentItem = NotebookMarkdownItem | NotebookCodeItem | TextBoxItem;

// Export job info (progress polling)
export interface ExportJobInfo {
  jobId: string;
  status: string;
  downloadUrl?: string;
  error?: string;
  errorCode?: string;
  progress?: number;
  attemptsMade?: number;
  attemptsMax?: number;
  durationMs?: number;
}
