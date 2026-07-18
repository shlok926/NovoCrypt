import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { verifyTurnstile } from '../middleware/turnstile.middleware';

const router = Router();

router.post('/register', authRateLimiter, verifyTurnstile, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, verifyTurnstile, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
