import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';

import { AppController } from './app.controller';
import { MetricsModule } from '../metrics/metrics.module';
import { ExportQueueModule } from './export-queue/export-queue.module';
import { ExportsModule } from './exports/exports.module';
import { ProjectsModule } from './projects/projects.module';
import { ProxyController } from './proxy/proxy.controller';
import { ProxyService } from './proxy/proxy.service';
import { ReportsModule } from './reports/reports.module';
import { TemplatesModule } from './templates/templates.module';
import { UsersModule } from './users/users.module';
import { AuthGuard } from '../common/auth/auth.guard';

@Module({
  imports: [UsersModule, ProjectsModule, ReportsModule, TemplatesModule, ExportsModule, ExportQueueModule, MetricsModule],
  controllers: [AppController, ProxyController],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new AuthGuard(reflector),
      inject: [Reflector],
    },
    ProxyService,
  ],
})
export class AppModule {}
