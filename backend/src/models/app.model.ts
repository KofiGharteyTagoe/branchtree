import { getDatabase, saveDatabase } from '../config/database.js';
import type { AppRow } from '../types/db.types.js';

// Fields returned in public queries — PAT is excluded for security
const PUBLIC_FIELDS = 'app_id, app_name, repo_url, repo_type, last_synced';

function rowToApp(row: Record<string, unknown>): AppRow {
  return {
    app_id: row.app_id as string,
    app_name: row.app_name as string | null,
    pat: row.pat as string | null ?? null,
    repo_url: row.repo_url as string | null,
    repo_type: row.repo_type as string | null,
    last_synced: row.last_synced as string | null,
  };
}

export function createApp(appId: string, pat: string, appName?: string): AppRow {
  const db = getDatabase();
  db.run(
    `INSERT INTO apps (app_id, app_name, pat)
     VALUES (?, ?, ?)
     ON CONFLICT(app_id) DO UPDATE SET
       app_name = COALESCE(excluded.app_name, apps.app_name),
       pat = excluded.pat`,
    [appId, appName || null, pat]
  );
  saveDatabase();
  return getApp(appId)!;
}

export function getApps(): AppRow[] {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM apps ORDER BY app_name, app_id`);
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
 * Get the PAT for an app. This is only used internally by services,
 * never exposed via API responses.
 */
export function getAppPat(appId: string): string | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT pat FROM apps WHERE app_id = ?');
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return (row.pat as string) || null;
  }
  stmt.free();
  return null;
}

export function updateAppPat(appId: string, pat: string): void {
  const db = getDatabase();
  db.run('UPDATE apps SET pat = ? WHERE app_id = ?', [pat, appId]);
  saveDatabase();
}

export function updateAppRepoInfo(
  appId: string,
  repoUrl: string,
  repoType: string
): void {
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
  db.run('UPDATE apps SET last_synced = ? WHERE app_id = ?', [
    new Date().toISOString(),
    appId,
  ]);
  saveDatabase();
}

export function deleteApp(appId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM apps WHERE app_id = ?', [appId]);
  saveDatabase();
}
