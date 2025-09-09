import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
  async enableShutdownHooks(app: INestApplication) {
    // Prisma の型に依存しないよう any 経由で登録
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
