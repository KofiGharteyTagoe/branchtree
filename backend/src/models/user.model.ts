import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase } from '../config/database.js';
import type { UserRow } from '../types/db.types.js';

const BCRYPT_ROUNDS = 12;

function rowToUser(row: Record<string, unknown>): UserRow {
  return {
    id: row.id as number,
    email: row.email as string,
    display_name: row.display_name as string | null,
    avatar_url: row.avatar_url as string | null,
    oauth_provider: row.oauth_provider as string,
    oauth_id: row.oauth_id as string,
    password_hash: row.password_hash as string | null,
    is_admin: row.is_admin as number,
    is_restricted: (row.is_restricted as number) || 0,
    restriction_reason: row.restriction_reason as string | null,
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
  avatarUrl?: string | null,
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
    [email, oauthProvider, oauthId, displayName || null, avatarUrl || null],
  );
  saveDatabase();
  return getUserByOAuth(oauthProvider, oauthId)!;
}

/**
 * Create a local admin account with email/password.
 */
export function createLocalAdmin(email: string, password: string, displayName?: string): UserRow {
  const db = getDatabase();
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  db.run(
    `INSERT INTO users (email, oauth_provider, oauth_id, display_name, password_hash, is_admin, last_login)
     VALUES (?, 'local', '', ?, ?, 1, datetime('now'))`,
    [email, displayName || null, passwordHash],
  );
  saveDatabase();
  return getUserByEmail(email)!;
}

/**
 * Verify a local user's password. Returns the user if valid, undefined otherwise.
 */
export function verifyLocalPassword(email: string, password: string): UserRow | undefined {
  const user = getUserByEmail(email);
  if (!user || !user.password_hash) return undefined;
  if (!bcrypt.compareSync(password, user.password_hash)) return undefined;
  // Update last_login
  const db = getDatabase();
  db.run(`UPDATE users SET last_login = datetime('now') WHERE id = ?`, [user.id]);
  saveDatabase();
  return { ...user, last_login: new Date().toISOString() };
}

/**
 * Change a user's password.
 */
export function changePassword(userId: number, newPassword: string): void {
  const db = getDatabase();
  const passwordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
  db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]);
  saveDatabase();
}

/**
 * Check if any admin users exist in the database.
 */
export function hasAdminUser(): boolean {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  return (row.count as number) > 0;
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

/**
 * Get all users with their app counts and database usage metadata.
 */
export function getAllUsersWithMeta(): Array<
  UserRow & { app_count: number; branch_count: number; commit_count: number }
> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT u.*,
      COALESCE((SELECT COUNT(*) FROM apps WHERE owner_id = u.id), 0) as app_count,
      COALESCE((SELECT COUNT(*) FROM branches b JOIN apps a ON b.app_id = a.app_id WHERE a.owner_id = u.id), 0) as branch_count,
      COALESCE((SELECT COUNT(*) FROM commits c JOIN apps a ON c.app_id = a.app_id WHERE a.owner_id = u.id), 0) as commit_count
    FROM users u
    ORDER BY u.created_at DESC
  `);
  const rows: Array<UserRow & { app_count: number; branch_count: number; commit_count: number }> =
    [];
  while (stmt.step()) {
    const raw = stmt.getAsObject();
    rows.push({
      ...rowToUser(raw),
      app_count: raw.app_count as number,
      branch_count: raw.branch_count as number,
      commit_count: raw.commit_count as number,
    });
  }
  stmt.free();
  return rows;
}

/**
 * Restrict a user with a reason.
 */
export function restrictUser(userId: number, reason: string): void {
  const db = getDatabase();
  db.run(`UPDATE users SET is_restricted = 1, restriction_reason = ? WHERE id = ?`, [
    reason,
    userId,
  ]);
  saveDatabase();
}

/**
 * Remove restriction from a user.
 */
export function unrestrictUser(userId: number): void {
  const db = getDatabase();
  db.run(`UPDATE users SET is_restricted = 0, restriction_reason = NULL WHERE id = ?`, [userId]);
  saveDatabase();
}

/**
 * Delete a user and their associated apps.
 */
export function deleteUser(userId: number): void {
  const db = getDatabase();
  // Delete apps owned by this user (cascades to branches, commits, merge_events)
  db.run(`DELETE FROM apps WHERE owner_id = ?`, [userId]);
  db.run(`DELETE FROM feedback WHERE user_id = ?`, [userId]);
  db.run(`DELETE FROM users WHERE id = ?`, [userId]);
  saveDatabase();
}
