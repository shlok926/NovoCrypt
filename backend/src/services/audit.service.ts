import { prisma } from '../config/database';
import { logger } from '../middleware/logger';

export interface AuditLogOptions {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  status: 'SUCCESS' | 'FAILURE' | 'DENIED';
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

export const auditService = {
  async log(options: AuditLogOptions): Promise<void> {
    try {
      // Structured log via Pino logger (PATCH-08 requirement)
      logger.info(
        {
          audit: true,
          action: options.action,
          resource: options.resource,
          resourceId: options.resourceId,
          status: options.status,
          userId: options.userId,
          ipAddress: options.ipAddress,
        },
        `Security Audit [${options.action}]: ${options.status}`
      );

      // Persist to PostgreSQL AuditLog table
      await prisma.auditLog.create({
        data: {
          userId: options.userId || null,
          action: options.action,
          resource: options.resource,
          resourceId: options.resourceId || null,
          status: options.status,
          ipAddress: options.ipAddress || null,
          userAgent: options.userAgent || null,
          metadata: options.metadata || undefined,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to record security audit log');
    }
  },

  async getAuditLogs(params: { userId?: string; action?: string; limit?: number; offset?: number }) {
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  },
};
