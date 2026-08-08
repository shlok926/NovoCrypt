import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth } from '../../src/middleware/auth.middleware';
import { AppError } from '../../src/middleware/error.middleware';
import * as jwtUtil from '../../src/utils/jwt.util';
import { sessionService } from '../../src/services/session.service';

vi.mock('../../src/services/session.service');

describe('Auth Middleware - Unit Tests', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
    };
    res = {};
    next = vi.fn();
  });

  it('should return 401 if Authorization header is missing', async () => {
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe('Authentication required');
  });

  it('should return 401 if Authorization header does not start with Bearer ', async () => {
    req.headers.authorization = 'Basic dXNlcjpwYXNz';
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should return 401 if verifyAccessToken throws generic error', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    vi.spyOn(jwtUtil, 'verifyAccessToken').mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(401);
    expect(next.mock.calls[0][0].message).toBe('Invalid or expired token');
  });

  it('should pass through AppError if verifyAccessToken throws AppError', async () => {
    req.headers.authorization = 'Bearer app-error-token';
    const appErr = new AppError('Custom App Error', 401);
    vi.spyOn(jwtUtil, 'verifyAccessToken').mockImplementation(() => {
      throw appErr;
    });

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(appErr);
  });

  it('should return 401 if payload is missing userId', async () => {
    req.headers.authorization = 'Bearer valid-token';
    vi.spyOn(jwtUtil, 'verifyAccessToken').mockReturnValue({
      userId: '',
      email: 'test@example.com',
      role: 'USER',
      jti: 'jti-123',
    });

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toBe('Invalid token payload: missing userId');
  });

  it('should return 401 if token JTI is blacklisted', async () => {
    req.headers.authorization = 'Bearer blacklisted-token';
    vi.spyOn(jwtUtil, 'verifyAccessToken').mockReturnValue({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      jti: 'jti-blacklisted',
    });
    vi.mocked(sessionService.isTokenBlacklisted).mockResolvedValue(true);

    await requireAuth(req, res, next);
    expect(sessionService.isTokenBlacklisted).toHaveBeenCalledWith('jti-blacklisted');
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toBe('Token has been revoked');
  });

  it('should set req.user and call next() for valid non-blacklisted token with JTI', async () => {
    req.headers.authorization = 'Bearer valid-token';
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'USER',
      jti: 'jti-valid',
    };
    vi.spyOn(jwtUtil, 'verifyAccessToken').mockReturnValue(payload);
    vi.mocked(sessionService.isTokenBlacklisted).mockResolvedValue(false);

    await requireAuth(req, res, next);
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it('should set req.user and call next() for valid token without JTI', async () => {
    req.headers.authorization = 'Bearer valid-no-jti-token';
    const payload = {
      userId: 'user-456',
      email: 'no-jti@example.com',
      role: 'USER',
      jti: undefined as any,
    };
    vi.spyOn(jwtUtil, 'verifyAccessToken').mockReturnValue(payload);

    await requireAuth(req, res, next);
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });
});
