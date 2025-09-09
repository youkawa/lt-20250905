import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportsService {
  private notebookUrl = process.env.NOTEBOOK_SERVICE_URL || 'http://localhost:8000';
  constructor(private readonly prisma: PrismaService) {}

  async startExport(
    payload: { title: string; content: any[]; metadata?: any; templateId?: string; templatePath?: string; format?: 'pptx' | 'pdf' },
    userId?: string,
  ) {
    // Enrich metadata: projectName/author/dataSources
    const meta: any = { ...(payload.metadata || {}) };
    if (meta.projectId && !meta.projectName && (this.prisma as any).project?.findUnique) {
      const proj = await (this.prisma as any).project.findUnique({ where: { id: meta.projectId }, select: { name: true } });
      if (proj?.name) meta.projectName = proj.name;
    }
    if (userId && !meta.author && (this.prisma as any).user?.findUnique) {
      const user = await (this.prisma as any).user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      meta.author = user?.name || user?.email || userId;
    }
    if (!Array.isArray(meta.dataSources)) {
      const set = new Set<string>();
      for (const item of payload.content || []) {
        const nb = item?.origin?.notebookName;
        if (nb && typeof nb === 'string') set.add(nb);
      }
      meta.dataSources = Array.from(set);
    }
    let templatePath = payload.templatePath;
    if (!templatePath && payload.templateId) {
      const tpl = await this.prisma.template.findUnique({ where: { id: payload.templateId } });
      if (!tpl) throw new NotFoundException('Template not found');
      const storagePath = (tpl.content as any)?.storagePath as string | undefined;
      if (!storagePath) throw new NotFoundException('Template storage path missing');
      templatePath = storagePath;
    }
    // Auto-apply default template if none specified
    if (!templatePath && !payload.templateId) {
      const all = await this.prisma.template.findMany({ orderBy: [{ version: 'desc' }, { createdAt: 'desc' }] });
      const projectId = payload.metadata?.projectId as string | undefined;
      const title = payload.title;
      const candidates = all
        .map((t) => ({ t, content: (t.content as any) || {} }))
        .map(({ t, content }) => {
          const rules = Array.isArray(content.rules) ? content.rules : [];
          let score = 0;
          let matched = false;
          // Evaluate rules
          for (const r of rules) {
            const pjOk = r.projectId ? r.projectId === projectId : true;
            const titleOk = r.titlePattern ? new RegExp(r.titlePattern).test(title) : true;
            if (pjOk && titleOk) {
              // specificity: both>project>title
              const s = (r.projectId ? 1 : 0) + (r.titlePattern ? 1 : 0);
              score = Math.max(score, s + 1); // 1..3
              matched = true;
            }
          }
          if (!matched && content.isDefault) score = Math.max(score, 1); // global default minimal score
          return { t, content, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score; // 高優先度
          if (b.t.version !== a.t.version) return b.t.version - a.t.version; // 新しいversion
          const bu = new Date((b.t as any).updatedAt).getTime();
          const au = new Date((a.t as any).updatedAt).getTime();
          if (bu !== au) return bu - au; // 最近更新
          const bc = new Date((b.t as any).createdAt).getTime();
          const ac = new Date((a.t as any).createdAt).getTime();
          return bc - ac; // 最近作成
        });
      const chosen = candidates[0];
      const storagePath = chosen ? chosen.content?.storagePath : undefined;
      if (storagePath) templatePath = storagePath as string;
    }
    const body = JSON.stringify({ title: payload.title, content: payload.content, metadata: meta, templatePath, format: payload.format || 'pptx' });
    // fetch with timeout
    const controller = new AbortController();
    const timeoutMs = Number(process.env.EXPORT_HTTP_TIMEOUT_MS || '15000');
    const to = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
    try {
      const res = await fetch(`${this.notebookUrl}/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: controller.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        const status = res.status || 0;
        const group = status >= 500 ? 'HTTP_5XX' : status >= 400 ? 'HTTP_4XX' : 'HTTP_OTHER';
        return { jobId: 'n/a', status: 'failed', error: `HTTP ${status} ${text}`, errorCode: `HTTP_${status}`, errorGroup: group } as any;
      }
      const json = await res.json();
      if (json && json.status === 'failed' && !json.errorCode) {
        json.errorCode = 'REMOTE_FAILED';
        json.errorGroup = 'REMOTE_FAILED';
      }
      return json;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        return { jobId: 'n/a', status: 'failed', error: 'Export service timeout', errorCode: 'TIMEOUT', errorGroup: 'NETWORK' } as any;
      }
      return { jobId: 'n/a', status: 'failed', error: e?.message || 'Network error', errorCode: 'NETWORK_ERROR', errorGroup: 'NETWORK' } as any;
    } finally {
      clearTimeout(to);
    }
  }
}
