import { Module } from '@nestjs/common';

import { AdminGuard } from '../../common/auth/admin.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, PrismaService, AdminGuard],
  exports: [TemplatesService],
})
export class TemplatesModule {}
