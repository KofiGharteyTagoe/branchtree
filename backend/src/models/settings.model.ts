import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';
import { getDatabase, saveDatabase } from '../config/database.js';

export interface SettingRow {
  key: string;
  value: string;
  is_secret: number;
  updated_at: string;
}

// ─── Settings-level encryption ──────────────────────────────────────────────
// Encrypts secret values at rest in the SQLite file so that a stolen database
// is not directly exploitable. Uses SETTINGS_ENCRYPTION_KEY env var if set,
// otherwise derives a machine-bound key from hostname.

const SETTINGS_ALGO = 'aes-256-gcm';
const SETTINGS_IV_LEN = 16;
const SETTINGS_SEP = ':';
const SETTINGS_PREFIX = 'enc:';

let _settingsKeyCache: Buffer | null = null;

function getSettingsKey(): Buffer {
  if (_settingsKeyCache) return _settingsKeyCache;

  const envKey = process.env.SETTINGS_ENCRYPTION_KEY;
  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    _settingsKeyCache = Buffer.from(envKey, 'hex');
  } else {
    // Deterministic fallback: derive from hostname so the DB can only be read
    // on the same machine. In production, always set SETTINGS_ENCRYPTION_KEY.
    const host = process.env.COMPUTERNAME || process.env.HOSTNAME || 'branchtree';
    _settingsKeyCache = createHash('sha256').update(`branchtree-settings-${host}`).digest();
  }
  return _settingsKeyCache;
}

function encryptSettingValue(plaintext: string): string {
  if (!plaintext) return plaintext; // don't encrypt empty strings
  const key = getSettingsKey();
  const iv = randomBytes(SETTINGS_IV_LEN);
  const cipher = createCipheriv(SETTINGS_ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return (
    SETTINGS_PREFIX +
    [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
      SETTINGS_SEP,
    )
  );
}

function decryptSettingValue(stored: string): string {
  if (!stored || !stored.startsWith(SETTINGS_PREFIX)) {
    // Legacy unencrypted value — return as-is (will be re-encrypted on next write)
    return stored;
  }
  const payload = stored.slice(SETTINGS_PREFIX.length);
  const parts = payload.split(SETTINGS_SEP);
  if (parts.length !== 3) throw new Error('Corrupt encrypted setting');
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const key = getSettingsKey();
  const decipher = createDecipheriv(SETTINGS_ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

// ─── CRUD ───────────────────────────────────────────────────────────────────

/**
 * Get a setting value by key. Returns null if not found.
 * Secret values are transparently decrypted.
 */
export function getSetting(key: string): string | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value, is_secret FROM settings WHERE key = ?');
  stmt.bind([key]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    const raw = row.value as string;
    return (row.is_secret as number) === 1 ? decryptSettingValue(raw) : raw;
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
 * Secret values are transparently encrypted before storage.
 */
export function setSetting(key: string, value: string, isSecret = false): void {
  const db = getDatabase();
  const storedValue = isSecret ? encryptSettingValue(value) : value;
  db.run(
    `INSERT INTO settings (key, value, is_secret, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       is_secret = excluded.is_secret,
       updated_at = datetime('now')`,
    [key, storedValue, isSecret ? 1 : 0],
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
    setSetting('setup_token', setupToken, true);
  }

  return setupToken;
}

/**
 * Migrate legacy plaintext secrets to encrypted format.
 * Call once during startup after initializeDefaults().
 */
export function migrateUnencryptedSecrets(): void {
  const db = getDatabase();
  const stmt = db.prepare('SELECT key, value FROM settings WHERE is_secret = 1');
  const toMigrate: Array<{ key: string; value: string }> = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as Record<string, unknown>;
    const value = row.value as string;
    // If it's not already encrypted and not empty, it needs migration
    if (value && !value.startsWith(SETTINGS_PREFIX)) {
      toMigrate.push({ key: row.key as string, value });
    }
  }
  stmt.free();

  for (const { key, value } of toMigrate) {
    const encrypted = encryptSettingValue(value);
    db.run('UPDATE settings SET value = ? WHERE key = ?', [encrypted, key]);
  }
  if (toMigrate.length > 0) {
    saveDatabase();
  }
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
