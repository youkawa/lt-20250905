import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from '../../common/auth/admin.guard';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, PrismaService, AdminGuard],
  exports: [TemplatesService],
})
export class TemplatesModule {}

