import { NextFunction, Request, Response } from 'express';
import { AppError } from './error.middleware';
import { verifyAccessToken } from '../utils/jwt.util';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      throw new AppError('Invalid token payload: missing userId', 401);
    }
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired token', 401);
  }
};
