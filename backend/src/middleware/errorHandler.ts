import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface ApiError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error({ err, statusCode }, `${statusCode} - ${message}`);
  if (statusCode === 500) {
    logger.error(err.stack);
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : message,
    message,
    statusCode,
  });
}

export function createApiError(message: string, statusCode: number): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
}
