import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/runtimeConfig.js';
import * as appModel from '../models/app.model.js';
import * as userModel from '../models/user.model.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

/**
 * Middleware that verifies the JWT from the Authorization header.
 * Attaches req.user = { userId, email } on success.
 * Returns 401 if token is missing or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: number; email: string };

    // Check if user is restricted
    const user = userModel.getUserById(payload.userId);
    if (user && user.is_restricted === 1) {
      res.status(403).json({ error: 'Your account has been restricted', reason: user.restriction_reason });
      return;
    }

    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware that checks if the current user owns the app specified by :appId.
 * Must be used AFTER authenticate middleware and validateAppId.
 * Returns 403 if the user does not own the app.
 */
export function authorizeAppOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const appId = req.params.appId;
  if (!appId) {
    res.status(400).json({ error: 'App ID is required' });
    return;
  }

  const app = appModel.getAppWithOwner(appId);
  if (!app) {
    res.status(404).json({ error: 'App not found' });
    return;
  }

  if (app.owner_id !== null && app.owner_id !== req.user.userId) {
    res.status(403).json({ error: 'You do not have permission to access this app' });
    return;
  }

  next();
}
