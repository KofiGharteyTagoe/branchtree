import { getDatabase, saveDatabase } from '../config/database.js';
import type { AppRow } from '../types/db.types.js';
import type { ProviderType } from '../types/provider.types.js';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption.js';

// Fields returned in public queries — PAT is excluded for security
const PUBLIC_FIELDS = 'app_id, app_name, repo_url, repo_type, provider_type, owner_id, last_synced';

function rowToApp(row: Record<string, unknown>): AppRow {
  return {
    app_id: row.app_id as string,
    app_name: row.app_name as string | null,
    pat: (row.pat as string | null) ?? null,
    repo_url: row.repo_url as string | null,
    repo_type: row.repo_type as string | null,
    provider_type: (row.provider_type as ProviderType) || 'mendix',
    owner_id: (row.owner_id as number | null) ?? null,
    last_synced: row.last_synced as string | null,
  };
}

export function createApp(
  appId: string,
  pat: string,
  providerType: ProviderType = 'mendix',
  appName?: string,
  repoUrl?: string,
  ownerId?: number,
): AppRow {
  const db = getDatabase();
  const encryptedPat = encrypt(pat);
  db.run(
    `INSERT INTO apps (app_id, app_name, pat, provider_type, repo_url, owner_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(app_id) DO UPDATE SET
       app_name = COALESCE(excluded.app_name, apps.app_name),
       pat = excluded.pat,
       provider_type = excluded.provider_type,
       repo_url = COALESCE(excluded.repo_url, apps.repo_url),
       owner_id = COALESCE(excluded.owner_id, apps.owner_id)`,
    [appId, appName || null, encryptedPat, providerType, repoUrl || null, ownerId || null],
  );
  saveDatabase();
  return getApp(appId)!;
}

export function getApps(ownerId?: number): AppRow[] {
  const db = getDatabase();
  let sql = `SELECT ${PUBLIC_FIELDS} FROM apps`;
  if (ownerId !== undefined) {
    sql += ' WHERE owner_id = ?';
  }
  sql += ' ORDER BY app_name, app_id';
  const stmt = db.prepare(sql);
  if (ownerId !== undefined) stmt.bind([ownerId]);
  const rows: AppRow[] = [];
  while (stmt.step()) {
    rows.push(rowToApp(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

export function getApp(appId: string): AppRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM apps WHERE app_id = ?`);
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = rowToApp(stmt.getAsObject());
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

/**
 * Get the decrypted PAT for an app. This is only used internally by services,
 * never exposed via API responses.
 */
export function getAppPat(appId: string): string | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT pat FROM apps WHERE app_id = ?');
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    const pat = (row.pat as string) || null;
    if (!pat) return null;
    // Decrypt if encrypted, return as-is if plaintext (pre-migration)
    if (isEncrypted(pat)) {
      return decrypt(pat);
    }
    return pat;
  }
  stmt.free();
  return null;
}

/**
 * Get app including owner_id — used for authorization checks.
 */
export function getAppWithOwner(appId: string): AppRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM apps WHERE app_id = ?`);
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = rowToApp(stmt.getAsObject());
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

/**
 * Get the provider type for an app.
 */
export function getAppProviderType(appId: string): ProviderType | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT provider_type FROM apps WHERE app_id = ?');
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return (row.provider_type as ProviderType) || 'mendix';
  }
  stmt.free();
  return null;
}

export function updateAppPat(appId: string, pat: string): void {
  const db = getDatabase();
  const encryptedPat = encrypt(pat);
  db.run('UPDATE apps SET pat = ? WHERE app_id = ?', [encryptedPat, appId]);
  saveDatabase();
}

export function updateAppRepoInfo(appId: string, repoUrl: string, repoType: string): void {
  const db = getDatabase();
  db.run('UPDATE apps SET repo_url = ?, repo_type = ? WHERE app_id = ?', [
    repoUrl,
    repoType,
    appId,
  ]);
  saveDatabase();
}

export function updateLastSynced(appId: string): void {
  const db = getDatabase();
  db.run('UPDATE apps SET last_synced = ? WHERE app_id = ?', [new Date().toISOString(), appId]);
  saveDatabase();
}

export function deleteApp(appId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM apps WHERE app_id = ?', [appId]);
  saveDatabase();
}
