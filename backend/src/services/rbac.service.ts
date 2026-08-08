import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../middleware/logger';
import { auditService } from './audit.service';

const PERMISSION_CACHE_PREFIX = 'user:permissions:';
const PERMISSION_CACHE_TTL = 900; // 15 minutes

export const rbacService = {
  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `${PERMISSION_CACHE_PREFIX}${userId}`;

    // 1. Try Redis cache lookup
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      logger.warn({ error, userId }, 'Redis permission cache lookup failed; falling back to DB');
    }

    // 2. Database query: Fetch permissions across all assigned user roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionSet = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    const permissions = Array.from(permissionSet);

    // 3. Cache in Redis
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.set(cacheKey, JSON.stringify(permissions), 'EX', PERMISSION_CACHE_TTL);
      }
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to cache permissions in Redis');
    }

    return permissions;
  },

  async clearUserPermissionCache(userId: string): Promise<void> {
    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        await redis.del(`${PERMISSION_CACHE_PREFIX}${userId}`);
      }
    } catch (error) {
      logger.warn({ error, userId }, 'Failed to invalidate Redis permission cache');
    }
  },

  async assignRole(userId: string, roleCode: string, assignedByUserId?: string): Promise<void> {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new Error(`Role '${roleCode}' not found`);
    }

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      create: {
        userId,
        roleId: role.id,
      },
      update: {},
    });

    await this.clearUserPermissionCache(userId);

    await auditService.log({
      userId: assignedByUserId || userId,
      action: 'rbac.role.assigned',
      resource: 'users',
      resourceId: userId,
      status: 'SUCCESS',
      metadata: { roleCode },
    });
  },

  async removeRole(userId: string, roleCode: string, removedByUserId?: string): Promise<void> {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new Error(`Role '${roleCode}' not found`);
    }

    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: role.id,
      },
    });

    await this.clearUserPermissionCache(userId);

    await auditService.log({
      userId: removedByUserId || userId,
      action: 'rbac.role.removed',
      resource: 'users',
      resourceId: userId,
      status: 'SUCCESS',
      metadata: { roleCode },
    });
  },

  async deleteRole(roleCode: string, deletedByUserId?: string): Promise<void> {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) {
      throw new Error(`Role '${roleCode}' not found`);
    }

    if (role.isSystem) {
      await auditService.log({
        userId: deletedByUserId,
        action: 'rbac.role.delete.denied',
        resource: 'roles',
        resourceId: role.id,
        status: 'DENIED',
        metadata: { roleCode, reason: 'Cannot delete protected system role' },
      });
      throw new Error(`Cannot delete protected system role '${roleCode}'`);
    }

    await prisma.role.delete({ where: { id: role.id } });

    await auditService.log({
      userId: deletedByUserId,
      action: 'rbac.role.deleted',
      resource: 'roles',
      resourceId: role.id,
      status: 'SUCCESS',
      metadata: { roleCode },
    });
  },

  async getRoles() {
    return await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  },

  async getPermissions() {
    return await prisma.permission.findMany();
  },
};
