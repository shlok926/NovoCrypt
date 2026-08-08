import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../../src/services/audit.service';
import { prisma } from '../../src/config/database';
import { logger } from '../../src/middleware/logger';

vi.mock('../../src/config/database', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('../../src/middleware/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Audit Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully record an audit log with full options', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({
      id: 'audit-1',
      userId: 'user-123',
      action: 'rbac.role.assigned',
      resource: 'users',
      resourceId: 'user-456',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'VitestAgent',
      metadata: { roleCode: 'ADMIN' },
      createdAt: new Date(),
    } as any);

    await auditService.log({
      userId: 'user-123',
      action: 'rbac.role.assigned',
      resource: 'users',
      resourceId: 'user-456',
      status: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'VitestAgent',
      metadata: { roleCode: 'ADMIN' },
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ audit: true, action: 'rbac.role.assigned' }),
      'Security Audit [rbac.role.assigned]: SUCCESS'
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        action: 'rbac.role.assigned',
        resource: 'users',
        resourceId: 'user-456',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: 'VitestAgent',
        metadata: { roleCode: 'ADMIN' },
      },
    });
  });

  it('should record an audit log with minimal options and handle null fallbacks', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    await auditService.log({
      action: 'system.event',
      resource: 'system',
      status: 'DENIED',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: null,
        action: 'system.event',
        resource: 'system',
        resourceId: null,
        status: 'DENIED',
        ipAddress: null,
        userAgent: null,
        metadata: undefined,
      },
    });
  });

  it('should catch database errors when creating audit log and log via logger.error', async () => {
    const dbErr = new Error('Database connection lost');
    vi.mocked(prisma.auditLog.create).mockRejectedValue(dbErr);

    await auditService.log({
      action: 'rbac.role.assigned',
      resource: 'users',
      status: 'SUCCESS',
    });

    expect(logger.error).toHaveBeenCalledWith(
      { error: dbErr },
      'Failed to record security audit log'
    );
  });

  it('should query audit logs with default limit and offset', async () => {
    const mockLogs = [{ id: 'audit-1' }, { id: 'audit-2' }];
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(2);

    const result = await auditService.getAuditLogs({});

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: 0,
    });
    expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: {} });
    expect(result).toEqual({
      logs: mockLogs,
      total: 2,
      limit: 50,
      offset: 0,
    });
  });

  it('should query audit logs with custom parameters and filters', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

    const result = await auditService.getAuditLogs({
      userId: 'user-789',
      action: 'auth.login',
      limit: 10,
      offset: 20,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-789', action: 'auth.login' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 20,
    });
    expect(prisma.auditLog.count).toHaveBeenCalledWith({
      where: { userId: 'user-789', action: 'auth.login' },
    });
    expect(result).toEqual({
      logs: [],
      total: 0,
      limit: 10,
      offset: 20,
    });
  });
});
