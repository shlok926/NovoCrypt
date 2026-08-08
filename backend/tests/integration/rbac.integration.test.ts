import { describe, it, expect, vi } from 'vitest';
import { prisma } from '../../src/config/database';
import { rbacService } from '../../src/services/rbac.service';
import { sessionService } from '../../src/services/session.service';

describe('RBAC & Session Management - Integration Tests', () => {
  it('should seed and retrieve system roles and permissions', async () => {
    const role = await prisma.role.create({
      data: {
        code: 'TEST_ADMIN',
        name: 'Test Administrator',
        description: 'Integration test role',
        isSystem: false,
      },
    });

    const permission = await prisma.permission.create({
      data: {
        code: 'test:execute',
        resource: 'test',
        action: 'execute',
        description: 'Test permission',
      },
    });

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    const user = await prisma.user.create({
      data: {
        email: 'rbac.test@example.com',
        passwordHash: 'hashedpass',
        name: 'RbacTestUser',
      },
    });

    await rbacService.assignRole(user.id, 'TEST_ADMIN');

    const userPermissions = await rbacService.getUserPermissions(user.id);
    expect(userPermissions).toContain('test:execute');
  });

  it('should create user session and support session revocation', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'session.test@example.com',
        passwordHash: 'hashedpass',
        name: 'SessionTestUser',
      },
    });

    const tokenJti = 'test-jti-12345';
    await sessionService.createSession(user.id, tokenJti, '127.0.0.1', 'IntegrationTest');

    let isBlacklisted = await sessionService.isTokenBlacklisted(tokenJti);
    expect(isBlacklisted).toBe(false);

    await sessionService.revokeSession(user.id, tokenJti);

    isBlacklisted = await sessionService.isTokenBlacklisted(tokenJti);
    expect(isBlacklisted).toBe(true);
  });
});
