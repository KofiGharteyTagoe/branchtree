import { getDatabase, saveDatabase } from '../config/database.js';
import type { UserRow } from '../types/db.types.js';

function rowToUser(row: Record<string, unknown>): UserRow {
  return {
    id: row.id as number,
    email: row.email as string,
    display_name: row.display_name as string | null,
    avatar_url: row.avatar_url as string | null,
    oauth_provider: row.oauth_provider as string,
    oauth_id: row.oauth_id as string,
    created_at: row.created_at as string,
    last_login: row.last_login as string | null,
  };
}

/**
 * Create or update a user after OAuth login.
 * On conflict (same oauth_provider + oauth_id), updates display info and last_login.
 */
export function upsertUser(
  email: string,
  oauthProvider: string,
  oauthId: string,
  displayName?: string | null,
  avatarUrl?: string | null
): UserRow {
  const db = getDatabase();
  db.run(
    `INSERT INTO users (email, oauth_provider, oauth_id, display_name, avatar_url, last_login)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(oauth_provider, oauth_id) DO UPDATE SET
       email = excluded.email,
       display_name = COALESCE(excluded.display_name, users.display_name),
       avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
       last_login = datetime('now')`,
    [email, oauthProvider, oauthId, displayName || null, avatarUrl || null]
  );
  saveDatabase();
  return getUserByOAuth(oauthProvider, oauthId)!;
}

export function getUserById(id: number): UserRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const user = rowToUser(stmt.getAsObject());
    stmt.free();
    return user;
  }
  stmt.free();
  return undefined;
}

export function getUserByEmail(email: string): UserRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  stmt.bind([email]);
  if (stmt.step()) {
    const user = rowToUser(stmt.getAsObject());
    stmt.free();
    return user;
  }
  stmt.free();
  return undefined;
}

export function getUserByOAuth(oauthProvider: string, oauthId: string): UserRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?');
  stmt.bind([oauthProvider, oauthId]);
  if (stmt.step()) {
    const user = rowToUser(stmt.getAsObject());
    stmt.free();
    return user;
  }
  stmt.free();
  return undefined;
}
