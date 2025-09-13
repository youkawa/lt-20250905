import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { verify, JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const req = context.switchToHttp().getRequest();
    // First, try JWT Bearer
    const authz: string | undefined = req.headers['authorization'] || req.headers['Authorization'];
    if (authz && typeof authz === 'string' && authz.toLowerCase().startsWith('bearer ')) {
      const token = authz.slice(7).trim();
      const secret = process.env.JWT_SECRET || 'dev-secret';
      try {
        const payload = verify(token, secret) as JwtPayload | string;
        const obj = typeof payload === 'string' ? {} : payload;
        const sub = (obj as any)?.sub || (obj as any)?.userId || (obj as any)?.id;
        if (sub) {
          req.user = { id: String(sub) };
          return true;
        }
      } catch (_) {
        // fallthrough to header fallback
      }
    }
    // Fallback: X-User-Id (development only)
    if (process.env.NODE_ENV !== 'production') {
      const userId = req.header('x-user-id');
      if (userId) {
        req.user = { id: String(userId) };
        return true;
      }
    }
    return false;
  }
}
