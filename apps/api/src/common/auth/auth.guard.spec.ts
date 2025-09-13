import { AuthGuard } from './auth.guard';
import { sign } from 'jsonwebtoken';

const makeCtx = (headers: Record<string, string> = {}) => ({
  switchToHttp: () => ({
    getRequest: () => ({ header: (k: string) => headers[k.toLowerCase()], headers, user: undefined as any }),
  }),
  getHandler: () => ({}),
  getClass: () => ({}),
} as any);

describe('AuthGuard', () => {
  it('allows when @Public is set', () => {
    const reflector = { getAllAndOverride: jest.fn(() => true) } as any;
    const guard = new AuthGuard(reflector);
    const ok = guard.canActivate(makeCtx());
    expect(ok).toBe(true);
  });

  it('denies when header is missing', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as any;
    const guard = new AuthGuard(reflector);
    const ok = guard.canActivate(makeCtx());
    expect(ok).toBe(false);
  });

  it('attaches user when X-User-Id present', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as any;
    const guard = new AuthGuard(reflector);
    const ctx = makeCtx({ 'x-user-id': 'u1' });
    const ok = guard.canActivate(ctx);
    expect(ok).toBe(true);
  });

  it('disables X-User-Id fallback in production', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as any;
    const guard = new AuthGuard(reflector);
    const old = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const ctx = makeCtx({ 'x-user-id': 'u1' });
    const ok = guard.canActivate(ctx);
    process.env.NODE_ENV = old;
    expect(ok).toBe(false);
  });

  it('accepts JWT bearer token and sets user from sub', () => {
    const reflector = { getAllAndOverride: jest.fn(() => false) } as any;
    const guard = new AuthGuard(reflector);
    const token = sign({ sub: 'u-jwt' }, process.env.JWT_SECRET || 'dev-secret');
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
    const ok = guard.canActivate(ctx);
    expect(ok).toBe(true);
  });
});
