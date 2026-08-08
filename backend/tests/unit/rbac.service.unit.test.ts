import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rbacService } from '../../src/services/rbac.service';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';
import { logger } from '../../src/middleware/logger';
import { auditService } from '../../src/services/audit.service';

vi.mock('../../src/config/database', () => ({
  prisma: {
    userRole: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    permission: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../src/config/redis', () => ({
  redis: {
    status: 'ready',
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock('../../src/middleware/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../src/services/audit.service', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

describe('RBAC Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (redis as any).status = 'ready';
  });

  describe('getUserPermissions', () => {
    it('should return permissions from Redis cache when hit occurs', async () => {
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(['assets:read', 'assets:write']));

      const perms = await rbacService.getUserPermissions('user-1');

      expect(redis.get).toHaveBeenCalledWith('user:permissions:user-1');
      expect(perms).toEqual(['assets:read', 'assets:write']);
      expect(prisma.userRole.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and cache permissions when Redis cache misses', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.userRole.findMany).mockResolvedValue([
        {
          role: {
            permissions: [
              { permission: { code: 'assets:read' } },
              { permission: { code: 'scanner:execute' } },
            ],
          },
        },
        {
          role: {
            permissions: [{ permission: { code: 'assets:read' } }],
          },
        },
      ] as any);

      const perms = await rbacService.getUserPermissions('user-1');

      expect(perms).toEqual(['assets:read', 'scanner:execute']);
      expect(redis.set).toHaveBeenCalledWith(
        'user:permissions:user-1',
        JSON.stringify(['assets:read', 'scanner:execute']),
        'EX',
        900
      );
    });

    it('should catch Redis lookup error, log warning, and fallback to DB', async () => {
      const redisErr = new Error('Redis down');
      vi.mocked(redis.get).mockRejectedValue(redisErr);
      vi.mocked(prisma.userRole.findMany).mockResolvedValue([]);

      const perms = await rbacService.getUserPermissions('user-1');

      expect(logger.warn).toHaveBeenCalledWith(
        { error: redisErr, userId: 'user-1' },
        'Redis permission cache lookup failed; falling back to DB'
      );
      expect(perms).toEqual([]);
    });

    it('should catch Redis set caching error and log warning', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.userRole.findMany).mockResolvedValue([]);
      const setErr = new Error('Redis set fail');
      vi.mocked(redis.set).mockRejectedValue(setErr);

      await rbacService.getUserPermissions('user-1');

      expect(logger.warn).toHaveBeenCalledWith(
        { error: setErr, userId: 'user-1' },
        'Failed to cache permissions in Redis'
      );
    });

    it('should support redis.status = connect for get and set cache', async () => {
      (redis as any).status = 'connect';
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(prisma.userRole.findMany).mockResolvedValue([]);
      vi.mocked(redis.set).mockResolvedValue('OK');

      await rbacService.getUserPermissions('user-1');

      expect(redis.get).toHaveBeenCalledWith('user:permissions:user-1');
      expect(redis.set).toHaveBeenCalled();
    });

    it('should skip redis get/set when redis.status is not connected', async () => {
      (redis as any).status = 'end';
      vi.mocked(prisma.userRole.findMany).mockResolvedValue([]);

      await rbacService.getUserPermissions('user-1');

      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('clearUserPermissionCache', () => {
    it('should delete cache key from Redis when status is ready', async () => {
      await rbacService.clearUserPermissionCache('user-1');
      expect(redis.del).toHaveBeenCalledWith('user:permissions:user-1');
    });

    it('should delete cache key when redis.status is connect', async () => {
      (redis as any).status = 'connect';
      await rbacService.clearUserPermissionCache('user-1');
      expect(redis.del).toHaveBeenCalledWith('user:permissions:user-1');
    });

    it('should skip redis del when redis.status is end', async () => {
      (redis as any).status = 'end';
      await rbacService.clearUserPermissionCache('user-1');
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should log warning if Redis del throws an error', async () => {
      (redis as any).status = 'ready';
      const delErr = new Error('Del error');
      vi.mocked(redis.del).mockRejectedValue(delErr);

      await rbacService.clearUserPermissionCache('user-1');

      expect(logger.warn).toHaveBeenCalledWith(
        { error: delErr, userId: 'user-1' },
        'Failed to invalidate Redis permission cache'
      );
    });
  });

  describe('assignRole', () => {
    it('should throw error if role is not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);

      await expect(rbacService.assignRole('user-1', 'UNKNOWN')).rejects.toThrow(
        "Role 'UNKNOWN' not found"
      );
    });

    it('should default assignedByUserId to userId if omitted', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 'role-1', code: 'ADMIN' } as any);

      await rbacService.assignRole('user-1', 'ADMIN');

      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'rbac.role.assigned',
        resource: 'users',
        resourceId: 'user-1',
        status: 'SUCCESS',
        metadata: { roleCode: 'ADMIN' },
      });
    });

    it('should upsert userRole, clear cache, and record audit log', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 'role-1', code: 'ADMIN' } as any);

      await rbacService.assignRole('user-1', 'ADMIN', 'admin-1');

      expect(prisma.userRole.upsert).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-1' } },
        create: { userId: 'user-1', roleId: 'role-1' },
        update: {},
      });
      expect(redis.del).toHaveBeenCalledWith('user:permissions:user-1');
      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'admin-1',
        action: 'rbac.role.assigned',
        resource: 'users',
        resourceId: 'user-1',
        status: 'SUCCESS',
        metadata: { roleCode: 'ADMIN' },
      });
    });
  });

  describe('removeRole', () => {
    it('should throw error if role is not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);

      await expect(rbacService.removeRole('user-1', 'UNKNOWN')).rejects.toThrow(
        "Role 'UNKNOWN' not found"
      );
    });

    it('should delete userRole, clear cache, and record audit log', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({ id: 'role-1', code: 'OPERATOR' } as any);

      await rbacService.removeRole('user-1', 'OPERATOR');

      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', roleId: 'role-1' },
      });
      expect(redis.del).toHaveBeenCalledWith('user:permissions:user-1');
      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'rbac.role.removed',
        resource: 'users',
        resourceId: 'user-1',
        status: 'SUCCESS',
        metadata: { roleCode: 'OPERATOR' },
      });
    });
  });

  describe('deleteRole', () => {
    it('should throw error if role is not found', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue(null);

      await expect(rbacService.deleteRole('MISSING')).rejects.toThrow(
        "Role 'MISSING' not found"
      );
    });

    it('should deny and log audit if role is a system role', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-sys',
        code: 'ADMIN',
        isSystem: true,
      } as any);

      await expect(rbacService.deleteRole('ADMIN', 'user-9')).rejects.toThrow(
        "Cannot delete protected system role 'ADMIN'"
      );

      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-9',
        action: 'rbac.role.delete.denied',
        resource: 'roles',
        resourceId: 'role-sys',
        status: 'DENIED',
        metadata: { roleCode: 'ADMIN', reason: 'Cannot delete protected system role' },
      });
    });

    it('should delete role and log audit if role is not a system role', async () => {
      vi.mocked(prisma.role.findUnique).mockResolvedValue({
        id: 'role-custom',
        code: 'CUSTOM_ROLE',
        isSystem: false,
      } as any);

      await rbacService.deleteRole('CUSTOM_ROLE', 'user-9');

      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-custom' } });
      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-9',
        action: 'rbac.role.deleted',
        resource: 'roles',
        resourceId: 'role-custom',
        status: 'SUCCESS',
        metadata: { roleCode: 'CUSTOM_ROLE' },
      });
    });
  });

  describe('getRoles & getPermissions', () => {
    it('should return roles with include permissions', async () => {
      const mockRoles = [{ id: 'role-1' }];
      vi.mocked(prisma.role.findMany).mockResolvedValue(mockRoles as any);

      const roles = await rbacService.getRoles();

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        include: { permissions: { include: { permission: true } } },
      });
      expect(roles).toEqual(mockRoles);
    });

    it('should return permissions', async () => {
      const mockPerms = [{ id: 'perm-1' }];
      vi.mocked(prisma.permission.findMany).mockResolvedValue(mockPerms as any);

      const perms = await rbacService.getPermissions();

      expect(prisma.permission.findMany).toHaveBeenCalled();
      expect(perms).toEqual(mockPerms);
    });
  });
});
