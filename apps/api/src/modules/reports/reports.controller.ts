import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, PaginationQuery, UpdateReportDto } from './dto';
import { CurrentUser } from '../../common/auth/user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateReportDto) {
    return this.reports.create(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.reports.findOneOwned(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reports.updateOwned(user.id, id, dto);
  }

  @Get('/projects/:projectId/reports')
  list(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    const t = take ? Number(take) : 20;
    return this.reports.listByProjectOwned(user.id, projectId, t, cursor);
  }
}
