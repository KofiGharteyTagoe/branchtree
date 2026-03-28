import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import * as userModel from '../models/user.model.js';
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  getAvailableProviders,
} from '../services/oauth.service.js';
import type { OAuthUserProfile } from '../services/oauth.service.js';

export const authRouter = Router();

function createJwt(userId: number, email: string): string {
  return jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: '24h' });
}

function handleOAuthCallback(profile: OAuthUserProfile): string {
  const user = userModel.upsertUser(
    profile.email,
    profile.provider,
    profile.oauthId,
    profile.displayName,
    profile.avatarUrl
  );
  return createJwt(user.id, user.email);
}

// GET /api/auth/providers — List available OAuth providers
authRouter.get('/auth/providers', (_req, res) => {
  res.json({ providers: getAvailableProviders() });
});

// GET /api/auth/me — Get current user from JWT
authRouter.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwtSecret) as { userId: number; email: string };
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
    });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// --- Google OAuth ---

// GET /api/auth/google — Initiate Google OAuth
authRouter.get('/auth/google', (_req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(503).json({ error: 'Google OAuth is not configured' });
  }
  res.redirect(getGoogleAuthUrl());
});

// GET /api/auth/google/callback — Google OAuth callback
authRouter.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code || typeof code !== 'string') {
    return res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
  }
  try {
    const profile = await exchangeGoogleCode(code);
    const token = handleOAuthCallback(profile);
    res.redirect(`${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
  }
});

// --- Microsoft OAuth ---

// GET /api/auth/microsoft — Initiate Microsoft OAuth
authRouter.get('/auth/microsoft', (_req, res) => {
  if (!config.microsoftClientId || !config.microsoftClientSecret) {
    return res.status(503).json({ error: 'Microsoft OAuth is not configured' });
  }
  res.redirect(getMicrosoftAuthUrl());
});

// GET /api/auth/microsoft/callback — Microsoft OAuth callback
authRouter.get('/auth/microsoft/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code || typeof code !== 'string') {
    return res.redirect(`${config.frontendUrl}/login?error=microsoft_auth_failed`);
  }
  try {
    const profile = await exchangeMicrosoftCode(code);
    const token = handleOAuthCallback(profile);
    res.redirect(`${config.frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('Microsoft OAuth error:', err);
    res.redirect(`${config.frontendUrl}/login?error=microsoft_auth_failed`);
  }
});
