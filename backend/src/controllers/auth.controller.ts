import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { authService } from '../services/auth.service';
import { signAccessToken } from '../utils/jwt.util';
import { sessionService } from '../services/session.service';
import { auditService } from '../services/audit.service';

const sanitizeUser = (user: { id: string; email: string; name: string | null; role: string }) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.register(req.body);
      const jti = crypto.randomUUID();
      await sessionService.createSession(user.id, jti, req.ip, req.get('user-agent'));
      const token = signAccessToken({ userId: user.id, email: user.email, role: user.role, jti });

      await auditService.log({
        userId: user.id,
        action: 'auth.register',
        resource: 'users',
        resourceId: user.id,
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        data: { user: sanitizeUser(user), token },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.login(req.body);
      const jti = crypto.randomUUID();
      await sessionService.createSession(user.id, jti, req.ip, req.get('user-agent'));
      const token = signAccessToken({ userId: user.id, email: user.email, role: user.role, jti });

      await auditService.log({
        userId: user.id,
        action: 'auth.login',
        resource: 'users',
        resourceId: user.id,
        status: 'SUCCESS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        data: { user: sanitizeUser(user), token },
      });
    } catch (err) {
      await auditService.log({
        action: 'auth.login.failure',
        resource: 'users',
        status: 'FAILURE',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { email: req.body?.email },
      });
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.userId && req.user?.jti) {
        await sessionService.revokeSession(req.user.userId, req.user.jti);

        await auditService.log({
          userId: req.user.userId,
          action: 'auth.logout',
          resource: 'users',
          status: 'SUCCESS',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }

      res.json({ success: true, data: { loggedOut: true } });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: { user: req.user } });
    } catch (err) {
      next(err);
    }
  },
};
