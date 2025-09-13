import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateReportDto, UpdateReportDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async assertProjectOwned(projectId: string, ownerId: string) {
    const ok = await this.prisma.project.findFirst({ where: { id: projectId, ownerId }, select: { id: true } });
    if (!ok) throw new ForbiddenException('Forbidden');
  }

  async create(ownerId: string, dto: CreateReportDto) {
    await this.assertProjectOwned(dto.projectId, ownerId);
    const latest = await this.prisma.report.findFirst({
      where: { projectId: dto.projectId, title: dto.title },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (latest?.version ?? 0) + 1;
    return this.prisma.report.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        version: nextVersion,
        content: (dto.content as unknown) as any,
        metadata: (dto.metadata as unknown) as any,
      },
    });
  }

  async findOneOwned(ownerId: string, id: string) {
    const rep = await this.prisma.report.findUnique({ where: { id }, include: { project: { select: { ownerId: true } } } });
    if (!rep) throw new NotFoundException('Report not found');
    if (rep.project.ownerId !== ownerId) throw new ForbiddenException('Forbidden');
    // omit project before returning
    return {
      id: rep.id,
      projectId: rep.projectId,
      title: rep.title,
      version: rep.version,
      content: rep.content,
      metadata: rep.metadata,
      createdAt: rep.createdAt,
      updatedAt: rep.updatedAt,
    };
  }

  async updateOwned(ownerId: string, id: string, dto: UpdateReportDto) {
    await this.findOneOwned(ownerId, id);
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = (dto.content as unknown) as any;
    if (dto.metadata !== undefined) data.metadata = (dto.metadata as unknown) as any;
    return this.prisma.report.update({ where: { id }, data });
  }

  async listByProjectOwned(ownerId: string, projectId: string, take = 20, cursor?: string) {
    await this.assertProjectOwned(projectId, ownerId);
    const items = await this.prisma.report.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
    });
    const hasMore = items.length === take;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;
    return { items, take, nextCursor, hasMore };
  }
}
