import { randomBytes } from 'crypto';
import { getDatabase, saveDatabase } from '../config/database.js';

export interface SettingRow {
  key: string;
  value: string;
  is_secret: number;
  updated_at: string;
}

/**
 * Get a setting value by key. Returns null if not found.
 */
export function getSetting(key: string): string | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.value as string;
  }
  stmt.free();
  return null;
}

/**
 * Get a setting as an integer. Returns defaultValue if not found.
 */
export function getSettingInt(key: string, defaultValue: number): number {
  const val = getSetting(key);
  if (val === null) return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Set a setting value. Creates or updates.
 */
export function setSetting(key: string, value: string, isSecret = false): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO settings (key, value, is_secret, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       is_secret = excluded.is_secret,
       updated_at = datetime('now')`,
    [key, value, isSecret ? 1 : 0],
  );
  saveDatabase();
}

/**
 * Delete a setting.
 */
export function deleteSetting(key: string): void {
  const db = getDatabase();
  db.run('DELETE FROM settings WHERE key = ?', [key]);
  saveDatabase();
}

/**
 * Get all settings. Secret values are masked in the response.
 */
export function getAllSettings(): Array<{
  key: string;
  value: string;
  isSecret: boolean;
  updatedAt: string;
}> {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM settings ORDER BY key');
  const rows: Array<{ key: string; value: string; isSecret: boolean; updatedAt: string }> = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    rows.push({
      key: row.key as string,
      value: (row.is_secret as number) === 1 ? '••••••••' : (row.value as string),
      isSecret: (row.is_secret as number) === 1,
      updatedAt: row.updated_at as string,
    });
  }
  stmt.free();
  return rows;
}

/**
 * Check if the app has been set up (admin account created).
 */
export function isSetupComplete(): boolean {
  return getSetting('setup_complete') === 'true';
}

/**
 * Initialize default settings on first run.
 * Auto-generates crypto secrets if they don't exist.
 * Returns the setup token if this is a first-run (null otherwise).
 */
export function initializeDefaults(): string | null {
  let setupToken: string | null = null;

  // Auto-generate JWT secret
  if (!getSetting('jwt_secret')) {
    setSetting('jwt_secret', randomBytes(32).toString('hex'), true);
  }

  // Auto-generate encryption key
  if (!getSetting('encryption_key')) {
    setSetting('encryption_key', randomBytes(32).toString('hex'), true);
  }

  // Set default thresholds
  if (!getSetting('sync_interval_minutes')) {
    setSetting('sync_interval_minutes', '15');
  }
  if (!getSetting('stale_branch_days')) {
    setSetting('stale_branch_days', '30');
  }
  if (!getSetting('divergence_threshold')) {
    setSetting('divergence_threshold', '20');
  }

  // Set default URLs
  if (!getSetting('cors_origin')) {
    setSetting('cors_origin', 'http://localhost:5173');
  }
  if (!getSetting('oauth_callback_url')) {
    setSetting('oauth_callback_url', 'http://localhost:3001');
  }
  if (!getSetting('frontend_url')) {
    setSetting('frontend_url', 'http://localhost:5173');
  }

  // Initialize OAuth placeholders (empty — admin configures via UI)
  if (!getSetting('google_client_id')) {
    setSetting('google_client_id', '');
  }
  if (!getSetting('google_client_secret')) {
    setSetting('google_client_secret', '', true);
  }
  if (!getSetting('microsoft_client_id')) {
    setSetting('microsoft_client_id', '');
  }
  if (!getSetting('microsoft_client_secret')) {
    setSetting('microsoft_client_secret', '', true);
  }

  // Generate one-time setup token if setup not complete
  if (!isSetupComplete()) {
    setupToken = randomBytes(24).toString('hex');
    // Store the token (not hashed — it's only valid until setup completes, then deleted)
    setSetting('setup_token', setupToken, true);
  }

  return setupToken;
}

// --- Convenience getters for commonly accessed settings ---

export function getJwtSecret(): string {
  const secret = getSetting('jwt_secret');
  if (!secret) throw new Error('JWT secret not initialized. Run initializeDefaults() first.');
  return secret;
}

export function getEncryptionKey(): string {
  const key = getSetting('encryption_key');
  if (!key) throw new Error('Encryption key not initialized. Run initializeDefaults() first.');
  return key;
}
