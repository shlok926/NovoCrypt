import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { signAccessToken } from '../utils/jwt.util';

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
      const token = signAccessToken({ userId: user.id, email: user.email, role: user.role });
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
      const token = signAccessToken({ userId: user.id, email: user.email, role: user.role });
      res.json({
        success: true,
        data: { user: sanitizeUser(user), token },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
