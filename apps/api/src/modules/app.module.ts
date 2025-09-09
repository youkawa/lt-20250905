import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthGuard } from '../common/auth/auth.guard';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { TemplatesModule } from './templates/templates.module';
import { ProxyController } from './proxy/proxy.controller';
import { ProxyService } from './proxy/proxy.service';
import { ExportsModule } from './exports/exports.module';
import { ExportQueueModule } from './export-queue/export-queue.module';
import { MetricsModule } from '../metrics/metrics.module';

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
