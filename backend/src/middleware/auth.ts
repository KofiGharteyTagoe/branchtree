import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/runtimeConfig.js';
import { createJwt, setSessionCookie } from '../routes/auth.routes.js';
import * as appModel from '../models/app.model.js';
import * as userModel from '../models/user.model.js';

const TOKEN_REFRESH_THRESHOLD = 60 * 60; // Refresh if < 1 hour remaining (seconds)

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
 * Middleware that verifies the JWT from the session cookie or Authorization header.
 * Checks httpOnly cookie first, falls back to Bearer token for API clients.
 * Attaches req.user = { userId, email } on success.
 * Returns 401 if token is missing or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.branchtree_session || extractBearerToken(req);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId: number;
      email: string;
      exp?: number;
    };

    // Check if user is restricted
    const user = userModel.getUserById(payload.userId);
    if (user && user.is_restricted === 1) {
      res
        .status(403)
        .json({ error: 'Your account has been restricted', reason: user.restriction_reason });
      return;
    }

    req.user = { userId: payload.userId, email: payload.email };

    // Sliding token refresh: if token expires within threshold, issue a new one
    if (payload.exp && req.cookies?.branchtree_session) {
      const secondsRemaining = payload.exp - Math.floor(Date.now() / 1000);
      if (secondsRemaining > 0 && secondsRemaining < TOKEN_REFRESH_THRESHOLD) {
        const newToken = createJwt(payload.userId, payload.email);
        setSessionCookie(res, newToken);
      }
    }

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
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
