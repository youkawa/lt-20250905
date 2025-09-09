import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(ownerId: string, data: CreateProjectDto) {
    return this.prisma.project.create({ data: { name: data.name, ownerId } });
  }

  findAllByOwner(ownerId: string) {
    return this.prisma.project.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
