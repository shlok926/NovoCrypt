import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requirePermission } from '../../src/middleware/rbac.middleware';
import { rbacService } from '../../src/services/rbac.service';
import { auditService } from '../../src/services/audit.service';
import { AppError } from '../../src/middleware/error.middleware';

vi.mock('../../src/services/rbac.service');
vi.mock('../../src/services/audit.service');

describe('RBAC Middleware - Unit Tests', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: 'user-123', email: 'test@example.com', role: 'USER' },
      baseUrl: '/api/rbac',
      path: '/roles',
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('VitestTestAgent'),
    };
    res = {};
    next = vi.fn();
  });

  it('should call next() if user possesses all required permissions', async () => {
    vi.mocked(rbacService.getUserPermissions).mockResolvedValue(['assets:read', 'scanner:execute']);

    const middleware = requirePermission('assets:read');
    await middleware(req, res, next);

    expect(rbacService.getUserPermissions).toHaveBeenCalledWith('user-123');
    expect(next).toHaveBeenCalledWith();
  });

  it('should return 401 Unauthorized error if req.user is missing', async () => {
    req.user = undefined;

    const middleware = requirePermission('assets:read');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should return 403 Forbidden error and log DENIED audit if missing required permission', async () => {
    vi.mocked(rbacService.getUserPermissions).mockResolvedValue(['assets:read']);
    vi.mocked(auditService.log).mockResolvedValue();

    const middleware = requirePermission('roles:manage');
    await middleware(req, res, next);

    expect(rbacService.getUserPermissions).toHaveBeenCalledWith('user-123');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DENIED',
        action: 'rbac.permission.denied',
      })
    );
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Insufficient permissions');
  });

  it('should reject deletion of protected system roles', async () => {
    const unmockedRbac = await vi.importActual<any>('../../src/services/rbac.service');
    const { prisma } = await import('../../src/config/database');
    vi.spyOn(prisma.role, 'findUnique').mockResolvedValue({
      id: 'role-admin',
      code: 'ADMIN',
      name: 'Admin',
      description: 'System Admin',
      isSystem: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(unmockedRbac.rbacService.deleteRole('ADMIN', 'user-123')).rejects.toThrow(
      "Cannot delete protected system role 'ADMIN'"
    );
  });
});
