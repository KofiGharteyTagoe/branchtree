import type { Request, Response, NextFunction } from 'express';
import { createApiError } from './errorHandler.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateAppId(req: Request, _res: Response, next: NextFunction): void {
  const { appId } = req.params;
  if (!appId || !UUID_REGEX.test(appId)) {
    return next(createApiError('Invalid App ID format. Expected a UUID.', 400));
  }
  next();
}

export function validateBranchName(req: Request, _res: Response, next: NextFunction): void {
  const { branchName } = req.params;
  if (!branchName || branchName.length === 0) {
    return next(createApiError('Branch name is required.', 400));
  }
  // Prevent path traversal
  if (branchName.includes('..') || branchName.includes('\0')) {
    return next(createApiError('Invalid branch name.', 400));
  }
  next();
}
