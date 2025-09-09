import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string } | undefined;
    if (!user?.id) throw new ForbiddenException('Forbidden');
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role !== 'ADMIN') {
      throw new ForbiddenException('Admins only');
    }
    return true;
    }
}

