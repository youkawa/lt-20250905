import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

import { CreateReportDto, UpdateReportDto } from './dto';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../../common/auth/user.decorator';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @ApiBody({ description: 'Create report' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateReportDto) {
    return this.reports.create(user.id, dto);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get report by id' })
  get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.reports.findOneOwned(user.id, id);
  }

  @Patch(':id')
  @ApiBody({ description: 'Partial update report' })
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reports.updateOwned(user.id, id, dto);
  }

  @Get('/projects/:projectId/reports')
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
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
