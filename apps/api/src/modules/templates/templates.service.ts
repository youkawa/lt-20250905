import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto, SetDefaultDto } from './dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTemplateDto) {
    return this.prisma.template.create({ data: { title: dto.title, version: dto.version, content: dto.content } });
  }

  list() {
    return this.prisma.template.findMany({ orderBy: [{ title: 'asc' }, { version: 'desc' }] });
  }

  async get(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.get(id);
    return this.prisma.template.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.template.delete({ where: { id } });
    return { ok: true };
  }

  async setDefault(id: string, rule?: SetDefaultDto) {
    const all = await this.prisma.template.findMany();
    const target = all.find((t) => t.id === id);
    if (!target) throw new NotFoundException('Template not found');
    const hasScope = !!(rule?.projectId || rule?.titlePattern);
    if (!hasScope) {
      // グローバル既定: 既存のisDefaultを全解除し、対象のみtrue
      for (const t of all) {
        const content = (t.content as any) || {};
        const next = { ...content } as any;
        next.isDefault = t.id === id;
        await this.prisma.template.update({ where: { id: t.id }, data: { content: next as any } });
      }
      return { ok: true };
    }
    // スコープ付き既定: content.rules にルールを追加
    const content = (target.content as any) || {};
    const rules = Array.isArray(content.rules) ? content.rules : [];
    rules.push({ projectId: rule?.projectId, titlePattern: rule?.titlePattern, isDefault: true, createdAt: new Date().toISOString() });
    content.rules = rules;
    await this.prisma.template.update({ where: { id }, data: { content } });
    return { ok: true };
  }
}
