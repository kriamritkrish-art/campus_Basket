import { describe, it, expect, vi } from 'vitest';
import { rbacGuard } from '../backend/src/middleware/rbacGuard';

describe('Role-Based Access Control (RBAC)', () => {
  it('allows access when user role matches allowed roles', () => {
    const middleware = rbacGuard(['ADMIN']);
    const req: any = { user: { role: 'ADMIN' } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects STUDENT trying to access ADMIN resource with HTTP 403', () => {
    const middleware = rbacGuard(['ADMIN']);
    const req: any = { user: { role: 'STUDENT' } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows SERVICE_PROVIDER to access shared provider/admin resources', () => {
    const middleware = rbacGuard(['ADMIN', 'SERVICE_PROVIDER']);
    const req: any = { user: { role: 'SERVICE_PROVIDER' } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
