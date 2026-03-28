import type { Request, Response, NextFunction } from 'express';
import { createApiError } from './errorHandler.js';

export function validateAppId(req: Request, _res: Response, next: NextFunction): void {
  const { appId } = req.params;
  if (!appId || appId.trim().length === 0) {
    return next(createApiError('App ID is required.', 400));
  }
  // Allow any non-empty string — different providers use different ID formats
  // (UUID for Mendix, owner/repo for GitHub, integer for GitLab, etc.)
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
