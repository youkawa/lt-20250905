import { Module } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { ReportsModule } from '../reports/reports.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ReportsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
