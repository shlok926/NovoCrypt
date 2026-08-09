import { Response } from 'express';

export interface ApiResponseMeta {
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  meta?: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

/**
 * Helper to send a standardized success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Partial<ApiResponseMeta>,
): Response {
  const requestId = (res.req as unknown as { id?: string })?.id;
  const responseBody: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
      ...meta,
    },
  };
  return res.status(statusCode).json(responseBody);
}

/**
 * Helper to send a standardized error response.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown,
): Response {
  const requestId = (res.req as unknown as { id?: string })?.id;
  const responseBody: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId ? { requestId } : {}),
      },
    },
  };
  return res.status(statusCode).json(responseBody);
}
