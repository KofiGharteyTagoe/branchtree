/**
 * Runtime configuration — reads from the database settings table.
 * All values here are managed through the admin UI, not .env files.
 *
 * These functions are called at request-time, so settings changes
 * take effect without a restart (except for sync interval, which
 * requires a scheduler restart).
 */
import * as settings from '../models/settings.model.js';

export function getJwtSecret(): string {
  return settings.getJwtSecret();
}

export function getEncryptionKey(): string {
  return settings.getEncryptionKey();
}

export function getCorsOrigin(): string {
  return settings.getSetting('cors_origin') || 'http://localhost:5173';
}

export function getOauthCallbackUrl(): string {
  return settings.getSetting('oauth_callback_url') || 'http://localhost:3001';
}

export function getFrontendUrl(): string {
  return settings.getSetting('frontend_url') || 'http://localhost:5173';
}

export function getGoogleClientId(): string {
  return settings.getSetting('google_client_id') || '';
}

export function getGoogleClientSecret(): string {
  return settings.getSetting('google_client_secret') || '';
}

export function getMicrosoftClientId(): string {
  return settings.getSetting('microsoft_client_id') || '';
}

export function getMicrosoftClientSecret(): string {
  return settings.getSetting('microsoft_client_secret') || '';
}

export function getSyncIntervalMinutes(): number {
  return settings.getSettingInt('sync_interval_minutes', 15);
}

export function getStaleBranchDays(): number {
  return settings.getSettingInt('stale_branch_days', 30);
}

export function getDivergenceThreshold(): number {
  return settings.getSettingInt('divergence_threshold', 20);
}
