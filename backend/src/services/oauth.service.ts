import { getGoogleClientId, getGoogleClientSecret, getMicrosoftClientId, getMicrosoftClientSecret, getOauthCallbackUrl } from '../config/runtimeConfig.js';

export interface OAuthUserProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  oauthId: string;
  provider: 'google' | 'microsoft';
}

// --- Google OAuth ---

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: `${getOauthCallbackUrl()}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<OAuthUserProfile> {
  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: `${getOauthCallbackUrl()}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  // Fetch user profile
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error('Failed to fetch Google user profile');
  }

  const profile = (await profileRes.json()) as {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };

  return {
    email: profile.email,
    displayName: profile.name || null,
    avatarUrl: profile.picture || null,
    oauthId: profile.id,
    provider: 'google',
  };
}

// --- Microsoft OAuth ---

export function getMicrosoftAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getMicrosoftClientId(),
    redirect_uri: `${getOauthCallbackUrl()}/api/auth/microsoft/callback`,
    response_type: 'code',
    scope: 'openid email profile User.Read',
    response_mode: 'query',
    prompt: 'select_account',
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeMicrosoftCode(code: string): Promise<OAuthUserProfile> {
  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getMicrosoftClientId(),
      client_secret: getMicrosoftClientSecret(),
      redirect_uri: `${getOauthCallbackUrl()}/api/auth/microsoft/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Microsoft token exchange failed: ${err}`);
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  // Fetch user profile from Microsoft Graph
  const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    throw new Error('Failed to fetch Microsoft user profile');
  }

  const profile = (await profileRes.json()) as {
    id: string;
    mail?: string;
    userPrincipalName: string;
    displayName?: string;
  };

  return {
    email: profile.mail || profile.userPrincipalName,
    displayName: profile.displayName || null,
    avatarUrl: null, // Microsoft Graph photo requires separate endpoint
    oauthId: profile.id,
    provider: 'microsoft',
  };
}

/**
 * Check which OAuth providers are configured.
 */
export function getAvailableProviders(): Array<'google' | 'microsoft'> {
  const providers: Array<'google' | 'microsoft'> = [];
  if (getGoogleClientId() && getGoogleClientSecret()) {
    providers.push('google');
  }
  if (getMicrosoftClientId() && getMicrosoftClientSecret()) {
    providers.push('microsoft');
  }
  return providers;
}
