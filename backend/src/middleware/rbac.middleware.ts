import { NextFunction, Request, Response } from 'express';
import { AppError } from './error.middleware';
import { rbacService } from '../services/rbac.service';
import { auditService } from '../services/audit.service';

export const requirePermission = (...requiredPermissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.user.userId) {
      return next(new AppError('Authentication required', 401));
    }

    try {
      const userPermissions = await rbacService.getUserPermissions(req.user.userId);
      const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

      if (!hasAllPermissions) {
        await auditService.log({
          userId: req.user.userId,
          action: 'rbac.permission.denied',
          resource: req.baseUrl + req.path,
          status: 'DENIED',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata: {
            requiredPermissions,
            userPermissions,
          },
        });

        return next(new AppError('Insufficient permissions to access this resource', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
