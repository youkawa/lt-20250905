import { Module } from '@nestjs/common';

import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { AdminGuard } from '../../common/auth/admin.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, PrismaService, AdminGuard],
  exports: [TemplatesService],
})
export class TemplatesModule {}
