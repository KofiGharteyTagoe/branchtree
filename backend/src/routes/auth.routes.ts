import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  getJwtSecret,
  getFrontendUrl,
  getGoogleClientId,
  getGoogleClientSecret,
  getMicrosoftClientId,
  getMicrosoftClientSecret,
} from '../config/runtimeConfig.js';
import * as userModel from '../models/user.model.js';
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  getAvailableProviders,
} from '../services/oauth.service.js';
import { logger } from '../utils/logger.js';
import type { OAuthUserProfile } from '../services/oauth.service.js';

export const authRouter = Router();

// Short-lived authorization codes for secure OAuth token exchange
const pendingCodes = new Map<string, { token: string; expiresAt: number }>();

// Clean up expired codes every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [code, entry] of pendingCodes) {
    if (entry.expiresAt <= now) pendingCodes.delete(code);
  }
}, 30_000);

function createAuthCode(token: string): string {
  const code = crypto.randomBytes(32).toString('hex');
  pendingCodes.set(code, { token, expiresAt: Date.now() + 60_000 }); // 60s TTL
  return code;
}

const SESSION_COOKIE = 'branchtree_session';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function setSessionCookie(res: import('express').Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

function extractBearerToken(req: import('express').Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

export function createJwt(userId: number, email: string): string {
  return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: '24h' });
}

function handleOAuthCallback(profile: OAuthUserProfile): string {
  const user = userModel.upsertUser(
    profile.email,
    profile.provider,
    profile.oauthId,
    profile.displayName,
    profile.avatarUrl,
  );
  return createJwt(user.id, user.email);
}

// GET /api/auth/providers — List available OAuth providers
authRouter.get('/auth/providers', (_req, res) => {
  res.json({ providers: getAvailableProviders() });
});

// GET /api/auth/me — Get current user from JWT (cookie or Bearer header)
authRouter.get('/auth/me', (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE] || extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret()) as { userId: number; email: string };
    const user = userModel.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      oauthProvider: user.oauth_provider,
      isAdmin: user.is_admin === 1,
      isRestricted: user.is_restricted === 1,
      restrictionReason: user.restriction_reason,
    });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// --- OAuth State (CSRF protection) ---

const OAUTH_STATE_COOKIE = 'branchtree_oauth_state';

function setOAuthStateCookie(res: import('express').Response): string {
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 5 * 60 * 1000, // 5 minutes
  });
  return state;
}

function validateOAuthState(
  req: import('express').Request,
  res: import('express').Response,
): boolean {
  const stateFromQuery = req.query.state;
  const stateFromCookie = req.cookies?.[OAUTH_STATE_COOKIE];
  // Clear the cookie regardless
  res.clearCookie(OAUTH_STATE_COOKIE, { path: '/api/auth' });
  return (
    typeof stateFromQuery === 'string' &&
    typeof stateFromCookie === 'string' &&
    stateFromQuery.length > 0 &&
    stateFromQuery === stateFromCookie
  );
}

// --- Google OAuth ---

// GET /api/auth/google — Initiate Google OAuth
authRouter.get('/auth/google', (_req, res) => {
  if (!getGoogleClientId() || !getGoogleClientSecret()) {
    return res.status(503).json({ error: 'Google OAuth is not configured' });
  }
  const state = setOAuthStateCookie(res);
  res.redirect(getGoogleAuthUrl(state));
});

// GET /api/auth/google/callback — Google OAuth callback
authRouter.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code || typeof code !== 'string') {
    return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
  }
  if (!validateOAuthState(req, res)) {
    return res.redirect(`${getFrontendUrl()}/login?error=invalid_state`);
  }
  try {
    const profile = await exchangeGoogleCode(code);
    const token = handleOAuthCallback(profile);
    const authCode = createAuthCode(token);
    res.redirect(`${getFrontendUrl()}/auth/callback?code=${encodeURIComponent(authCode)}`);
  } catch (err) {
    logger.error({ err }, 'Google OAuth error');
    res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
  }
});

// --- Microsoft OAuth ---

// GET /api/auth/microsoft — Initiate Microsoft OAuth
authRouter.get('/auth/microsoft', (_req, res) => {
  if (!getMicrosoftClientId() || !getMicrosoftClientSecret()) {
    return res.status(503).json({ error: 'Microsoft OAuth is not configured' });
  }
  const state = setOAuthStateCookie(res);
  res.redirect(getMicrosoftAuthUrl(state));
});

// GET /api/auth/microsoft/callback — Microsoft OAuth callback
authRouter.get('/auth/microsoft/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code || typeof code !== 'string') {
    return res.redirect(`${getFrontendUrl()}/login?error=microsoft_auth_failed`);
  }
  if (!validateOAuthState(req, res)) {
    return res.redirect(`${getFrontendUrl()}/login?error=invalid_state`);
  }
  try {
    const profile = await exchangeMicrosoftCode(code);
    const token = handleOAuthCallback(profile);
    const authCode = createAuthCode(token);
    res.redirect(`${getFrontendUrl()}/auth/callback?code=${encodeURIComponent(authCode)}`);
  } catch (err) {
    logger.error({ err }, 'Microsoft OAuth error');
    res.redirect(`${getFrontendUrl()}/login?error=microsoft_auth_failed`);
  }
});

// POST /api/auth/exchange — Exchange short-lived code for JWT
authRouter.post('/auth/exchange', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  const entry = pendingCodes.get(code);
  if (!entry) {
    return res.status(401).json({ error: 'Invalid or expired authorization code' });
  }

  if (entry.expiresAt <= Date.now()) {
    pendingCodes.delete(code);
    return res.status(401).json({ error: 'Authorization code has expired' });
  }

  pendingCodes.delete(code);
  setSessionCookie(res, entry.token);
  res.json({ success: true });
});

// POST /api/auth/logout — Clear session cookie
authRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ success: true });
});
