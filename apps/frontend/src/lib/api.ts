import { apiConfig, buildAuthHeaders } from './config';
import { request, jsonOptions } from './http';
import type {
  CursorPage,
  Paginated,
  Project,
  Report,
  ReportContentItem,
  ParsedNotebook,
  User,
} from '../types/api';

// Projects
export const ProjectsApi = {
  async list(): Promise<Project[]> {
    const url = `${apiConfig.apiBaseUrl}/projects`;
    return request<Project[]>(url, { headers: buildAuthHeaders() });
  },
  async create(name: string): Promise<Project> {
    const url = `${apiConfig.apiBaseUrl}/projects`;
    return request<Project>(url, jsonOptions('POST', { name }, buildAuthHeaders()));
  },
  async get(id: string): Promise<Project> {
    const url = `${apiConfig.apiBaseUrl}/projects/${id}`;
    return request<Project>(url, { headers: buildAuthHeaders() });
  },
  async remove(id: string): Promise<{ ok: boolean }> {
    const url = `${apiConfig.apiBaseUrl}/projects/${id}`;
    return request<{ ok: boolean }>(url, { method: 'DELETE', headers: buildAuthHeaders() });
  },
};

// Reports
export const ReportsApi = {
  async listByProject(
    projectId: string,
    params?: { page?: number; pageSize?: number; cursor?: string; take?: number },
  ): Promise<Paginated<Report> | CursorPage<Report>> {
    const url = new URL(
      `${apiConfig.apiBaseUrl}/projects/${encodeURIComponent(projectId)}/reports`,
    );
    if (params?.cursor) {
      url.searchParams.set('cursor', params.cursor);
      if (params?.take) url.searchParams.set('take', String(params.take));
    } else {
      if (params?.page) url.searchParams.set('page', String(params.page));
      if (params?.pageSize) url.searchParams.set('pageSize', String(params.pageSize));
    }
    return request(url.toString(), { headers: buildAuthHeaders() });
  },
  async create(input: {
    projectId: string;
    title: string;
    content: ReportContentItem[];
    metadata?: Record<string, unknown>;
  }): Promise<Report> {
    const url = `${apiConfig.apiBaseUrl}/reports`;
    return request<Report>(url, jsonOptions('POST', input, buildAuthHeaders()));
  },
  async get(id: string): Promise<Report> {
    const url = `${apiConfig.apiBaseUrl}/reports/${id}`;
    return request<Report>(url, { headers: buildAuthHeaders() });
  },
  async update(id: string, patch: Partial<Pick<Report, 'title' | 'content' | 'metadata'>>): Promise<Report> {
    const url = `${apiConfig.apiBaseUrl}/reports/${id}`;
    return request<Report>(url, jsonOptions('PATCH', patch, buildAuthHeaders()));
  },
};

// Notebook service
export const NotebookApi = {
  async parseNotebook(file: File): Promise<ParsedNotebook> {
    const url = `${apiConfig.notebookBaseUrl}/parse`;
    const fd = new FormData();
    fd.append('file', file);
    // Notebook マイクロサービスには X-User-Id は不要想定
    return request<ParsedNotebook>(url, { method: 'POST', body: fd });
  },
};

// Export jobs via main API proxy
export const ExportJobsApi = {
  get(jobId: string): Promise<{ jobId: string; status: string; downloadUrl?: string; error?: string; errorCode?: string }> {
    const url = `${apiConfig.apiBaseUrl}/export-jobs/${encodeURIComponent(jobId)}`;
    return request(url, { headers: buildAuthHeaders() });
  },
};

export const ExportApi = {
  start(input: {
    title: string;
    content: ReportContentItem[];
    metadata?: Record<string, unknown>;
    templateId?: string;
    templatePath?: string;
    format?: 'pptx' | 'pdf';
  }): Promise<{ jobId: string; status: string; downloadUrl?: string }> {
    const url = `${apiConfig.apiBaseUrl}/exports`;
    return request(url, jsonOptions('POST', input, buildAuthHeaders()));
  },
};

// Templates (admin)
export const TemplatesApi = {
  list(): Promise<Array<{ id: string; title: string; version: number; content: any; createdAt: string }>> {
    const url = `${apiConfig.apiBaseUrl}/templates`;
    return request<Array<{ id: string; title: string; version: number; content: any; createdAt: string }>>(url, { headers: buildAuthHeaders() });
  },
  async upload(file: File, title: string, version: number): Promise<{ id: string }> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('version', String(version));
    const url = `${apiConfig.apiBaseUrl}/templates/upload`;
    return request(url, { method: 'POST', body: fd, headers: buildAuthHeaders() });
  },
  remove(id: string): Promise<{ ok: boolean }> {
    const url = `${apiConfig.apiBaseUrl}/templates/${encodeURIComponent(id)}`;
    return request(url, { method: 'DELETE', headers: buildAuthHeaders() });
  },
  setDefault(id: string, body?: { projectId?: string; titlePattern?: string }): Promise<{ ok: boolean }> {
    const url = `${apiConfig.apiBaseUrl}/templates/${encodeURIComponent(id)}/default`;
    if (body && (body.projectId || body.titlePattern)) {
      return request(url, jsonOptions('POST', body, buildAuthHeaders()));
    }
    return request(url, { method: 'POST', headers: buildAuthHeaders() });
  },
};

// Users
export const UsersApi = {
  me(): Promise<User | null> {
    const url = `${apiConfig.apiBaseUrl}/users/me`;
    return request<User>(url, { headers: buildAuthHeaders() }).catch(() => null);
  },
  list(): Promise<User[]> {
    const url = `${apiConfig.apiBaseUrl}/users`;
    return request<User[]>(url, { headers: buildAuthHeaders() });
  },
};
