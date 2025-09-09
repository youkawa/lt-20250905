import { Body, Controller, Delete, Get, Param, Post, NotFoundException, ForbiddenException, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto';
import { CurrentUser } from '../../common/auth/user.decorator';
import { ReportsService } from '../reports/reports.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService, private readonly reports: ReportsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.projects.findAllByOwner(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.id, dto);
  }

  @Get(':id')
  async get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const proj = await this.projects.findOne(id);
    if (!proj) throw new NotFoundException('Project not found');
    if (proj.ownerId !== user.id) throw new ForbiddenException('Forbidden');
    return proj;
  }

  @Delete(':id')
  async delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const proj = await this.projects.findOne(id);
    if (!proj) throw new NotFoundException('Project not found');
    if (proj.ownerId !== user.id) throw new ForbiddenException('Forbidden');
    return this.projects.delete(id);
  }

  @Get(':id/reports')
  listReports(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    const t = take ? Number(take) : 20;
    return this.reports.listByProjectOwned(user.id, id, t, cursor);
  }
}
