import { create } from 'zustand';
import type { Project } from '@/types/api';
import { ProjectsApi } from '@/lib/api';

type ProjectsState = {
  projects: Project[];
  loading: boolean;
  error?: string;
  fetch: () => Promise<void>;
  create: (name: string) => Promise<Project>;
  remove: (id: string) => Promise<void>;
};

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  async fetch() {
    set({ loading: true, error: undefined });
    try {
      const items = await ProjectsApi.list();
      set({ projects: items });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '取得に失敗しました' });
    } finally {
      set({ loading: false });
    }
  },
  async create(name: string) {
    const p = await ProjectsApi.create(name);
    set({ projects: [p, ...get().projects] });
    return p;
  },
  async remove(id: string) {
    await ProjectsApi.remove(id);
    set({ projects: get().projects.filter((x) => x.id !== id) });
  },
}));
