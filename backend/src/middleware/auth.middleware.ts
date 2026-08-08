import { NextFunction, Request, Response } from 'express';
import { AppError } from './error.middleware';
import { verifyAccessToken } from '../utils/jwt.util';
import { sessionService } from '../services/session.service';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      return next(new AppError('Invalid token payload: missing userId', 401));
    }

    if (payload.jti) {
      const isBlacklisted = await sessionService.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) {
        return next(new AppError('Token has been revoked', 401));
      }
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('Invalid or expired token', 401));
  }
};
