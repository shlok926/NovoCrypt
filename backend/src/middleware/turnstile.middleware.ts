import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const verifyTurnstile = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.body['cf-turnstile-response'];

  // Skip if we are in development and no key is provided, or for tests
  if (!env.TURNSTILE_SECRET_KEY) {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      return next();
    }
    return res.status(500).json({ success: false, message: 'Server misconfiguration: Turnstile key missing.' });
  }

  if (!token) {
    return res.status(400).json({ success: false, message: 'CAPTCHA token is required.' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn('[SECURITY] Turnstile validation failed:', data['error-codes']);
      return res.status(403).json({ success: false, message: 'CAPTCHA validation failed. Are you a bot?' });
    }

    // Success - user is human
    next();
  } catch (error) {
    console.error('[SECURITY] Error during Turnstile validation:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during CAPTCHA validation.' });
  }
};
