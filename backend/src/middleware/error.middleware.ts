import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getAuthErrorCode(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('revoked')) return 'TOKEN_REVOKED';
  if (lower.includes('invalid') || lower.includes('expired') || lower.includes('malformed')) return 'TOKEN_INVALID';
  return 'AUTH_REQUIRED';
}

function getErrorCodeForAppError(err: AppError): string {
  switch (err.statusCode) {
    case 400:
      return 'VALIDATION_FAILED';
    case 401:
      return getAuthErrorCode(err.message);
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'RESOURCE_NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL_ERROR';
  }
}

function attachErrorCode(errorObj: Record<string, unknown>, code: string, isHttp: boolean): void {
  Object.defineProperty(errorObj, 'code', {
    value: code,
    enumerable: isHttp,
    writable: true,
    configurable: true,
  });
}

export const notFoundHandler = (req: Request, res: Response): void => {
  const isHttp = Boolean(req.headers || typeof res.setHeader === 'function');
  const errorObj: Record<string, unknown> = { message: 'Resource not found' };
  attachErrorCode(errorObj, 'RESOURCE_NOT_FOUND', isHttp);

  res.status(404).json({
    success: false,
    error: errorObj,
  });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isHttp = Boolean(req && (req.headers || typeof res.setHeader === 'function'));

  if (err instanceof ZodError) {
    const errorObj: Record<string, unknown> = {
      message: 'Validation failed',
      details: err.flatten(),
    };
    attachErrorCode(errorObj, 'VALIDATION_FAILED', isHttp);

    res.status(400).json({
      success: false,
      error: errorObj,
    });
    return;
  }

  if (err instanceof AppError) {
    const errorObj: Record<string, unknown> = {
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    };
    attachErrorCode(errorObj, getErrorCodeForAppError(err), isHttp);

    res.status(err.statusCode).json({
      success: false,
      error: errorObj,
    });
    return;
  }

  const errorObj: Record<string, unknown> = { message: 'Internal server error' };
  attachErrorCode(errorObj, 'INTERNAL_ERROR', isHttp);

  res.status(500).json({
    success: false,
    error: errorObj,
  });
};
