import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError, errorHandler, notFoundHandler } from '../../src/middleware/error.middleware';
import { ZodError } from 'zod';

describe('Error Middleware - Unit Tests', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('AppError', () => {
    it('should initialize AppError with custom message, statusCode, and details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const err = new AppError('Custom Error', 422, details);
      expect(err.message).toBe('Custom Error');
      expect(err.statusCode).toBe(422);
      expect(err.details).toEqual(details);
    });

    it('should default statusCode to 500 if not provided', () => {
      const err = new AppError('Server Error');
      expect(err.statusCode).toBe(500);
      expect(err.details).toBeUndefined();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with Resource not found message', () => {
      notFoundHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Resource not found' },
      });
    });
  });

  describe('errorHandler', () => {
    it('should handle ZodError with 400 status and flattened details', () => {
      const zodErr = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['username'],
          message: 'Expected string, received number',
        },
      ]);

      errorHandler(zodErr, req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed',
          details: zodErr.flatten(),
        },
      });
    });

    it('should handle AppError with custom status code and details', () => {
      const appErr = new AppError('Unauthorized access', 401, { reason: 'Expired session' });

      errorHandler(appErr, req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized access',
          details: { reason: 'Expired session' },
        },
      });
    });

    it('should handle unknown generic Error with 500 status', () => {
      const genericErr = new Error('Database crash');

      errorHandler(genericErr, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Internal server error' },
      });
    });
  });
});
