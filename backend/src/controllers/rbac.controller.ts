import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbac.service';
import { sessionService } from '../services/session.service';
import { auditService } from '../services/audit.service';

export const rbacController = {
  async getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await rbacService.getRoles();
      res.json({ success: true, data: { roles } });
    } catch (err) {
      next(err);
    }
  },

  async getPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await rbacService.getPermissions();
      res.json({ success: true, data: { permissions } });
    } catch (err) {
      next(err);
    }
  },

  async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleCode } = req.body;
      await rbacService.assignRole(userId, roleCode, req.user?.userId);
      res.json({ success: true, data: { assigned: true, userId, roleCode } });
    } catch (err) {
      next(err);
    }
  },

  async removeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleCode } = req.body;
      await rbacService.removeRole(userId, roleCode, req.user?.userId);
      res.json({ success: true, data: { removed: true, userId, roleCode } });
    } catch (err) {
      next(err);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleCode } = req.params;
      await rbacService.deleteRole(roleCode, req.user?.userId);
      res.json({ success: true, data: { deleted: true, roleCode } });
    } catch (err: any) {
      if (err?.message?.includes('Cannot delete protected system role')) {
        res.status(403).json({ success: false, error: { message: err.message } });
        return;
      }
      next(err);
    }
  },

  async getUserPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        res.status(400).json({ success: false, error: { message: 'Missing userId parameter' } });
        return;
      }
      const permissions = await rbacService.getUserPermissions(userId);
      res.json({ success: true, data: { userId, permissions } });
    } catch (err) {
      next(err);
    }
  },

  async getUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.userId;
      if (!userId) {
        res.status(400).json({ success: false, error: { message: 'Missing userId parameter' } });
        return;
      }
      const sessions = await sessionService.getUserSessions(userId);
      res.json({ success: true, data: { userId, sessions } });
    } catch (err) {
      next(err);
    }
  },

  async revokeAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.body?.userId || req.user?.userId;
      if (!userId) {
        res.status(400).json({ success: false, error: { message: 'Missing userId parameter' } });
        return;
      }
      await sessionService.revokeAllSessions(userId);

      await auditService.log({
        userId: req.user?.userId,
        action: 'auth.sessions.revoke_all',
        resource: 'users',
        resourceId: userId,
        status: 'SUCCESS',
        ipAddress: req.ip,
      });

      res.json({ success: true, data: { revokedAll: true, userId } });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, action, limit, offset } = req.query;
      const result = await auditService.getAuditLogs({
        userId: userId as string,
        action: action as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
