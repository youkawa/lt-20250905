import { AdminGuard } from './admin.guard';

const makeCtx = (userId?: string) => ({
  switchToHttp: () => ({ getRequest: () => ({ user: userId ? { id: userId } : undefined }) }),
} as any);

describe('AdminGuard', () => {
  it('allows ADMIN role', async () => {
    const prisma = { user: { findUnique: jest.fn(async () => ({ role: 'ADMIN' })) } } as any;
    const guard = new AdminGuard(prisma);
    await expect(guard.canActivate(makeCtx('u1'))).resolves.toBe(true);
  });

  it('denies non-admin', async () => {
    const prisma = { user: { findUnique: jest.fn(async () => ({ role: 'USER' })) } } as any;
    const guard = new AdminGuard(prisma);
    await expect(guard.canActivate(makeCtx('u1'))).rejects.toThrow('Admins only');
  });

  it('denies without user', async () => {
    const prisma = { user: { findUnique: jest.fn(async () => null) } } as any;
    const guard = new AdminGuard(prisma);
    await expect(guard.canActivate(makeCtx(undefined))).rejects.toThrow();
  });
});

