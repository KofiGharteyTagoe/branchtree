import type { Database } from 'sql.js';
import { encrypt, isEncrypted } from '../utils/encryption.js';

export function initializeDatabase(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      oauth_provider TEXT NOT NULL,
      oauth_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT,
      UNIQUE(oauth_provider, oauth_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS apps (
      app_id TEXT PRIMARY KEY,
      app_name TEXT,
      pat TEXT,
      repo_url TEXT,
      repo_type TEXT,
      provider_type TEXT NOT NULL DEFAULT 'mendix',
      owner_id INTEGER REFERENCES users(id),
      last_synced TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL REFERENCES apps(app_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      fork_point_commit TEXT,
      forked_from_branch TEXT,
      first_unique_commit TEXT,
      first_unique_commit_author TEXT,
      first_unique_commit_date TEXT,
      latest_commit_hash TEXT,
      latest_commit_date TEXT,
      commits_ahead_of_main INTEGER DEFAULT 0,
      commits_behind_main INTEGER DEFAULT 0,
      is_merged INTEGER DEFAULT 0,
      is_stale INTEGER DEFAULT 0,
      branch_type TEXT,
      provider_metadata TEXT DEFAULT '{}',
      UNIQUE(app_id, name)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS commits (
      hash TEXT NOT NULL,
      app_id TEXT NOT NULL REFERENCES apps(app_id) ON DELETE CASCADE,
      author_name TEXT,
      author_email TEXT,
      commit_date TEXT,
      message TEXT,
      parent_hashes TEXT DEFAULT '[]',
      is_merge_commit INTEGER DEFAULT 0,
      branch_names TEXT DEFAULT '[]',
      ref_names TEXT,
      provider_metadata TEXT DEFAULT '{}',
      PRIMARY KEY (hash, app_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS merge_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT NOT NULL REFERENCES apps(app_id) ON DELETE CASCADE,
      merge_commit_hash TEXT NOT NULL,
      source_branch TEXT,
      target_branch TEXT,
      merged_by TEXT,
      merged_date TEXT
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_branches_app_id ON branches(app_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_commits_app_id ON commits(app_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_merge_events_app_id ON merge_events(app_id)`);

  // Migrations for existing databases — safe to run multiple times (ALTER TABLE IF NOT EXISTS)
  migrateToProviderSchema(db);
  migrateEncryptPats(db);
}

/**
 * Migrate existing databases from Mendix-specific columns to provider-agnostic schema.
 * Uses try/catch because SQLite doesn't support IF NOT EXISTS for ALTER TABLE.
 */
function migrateToProviderSchema(db: Database): void {
  // Add owner_id to apps (multi-tenancy)
  try { db.run(`ALTER TABLE apps ADD COLUMN owner_id INTEGER REFERENCES users(id)`); } catch { /* column already exists */ }

  // Add provider_type to apps
  try { db.run(`ALTER TABLE apps ADD COLUMN provider_type TEXT NOT NULL DEFAULT 'mendix'`); } catch { /* column already exists */ }

  // Add provider_metadata to branches (replacing mendix_version)
  try { db.run(`ALTER TABLE branches ADD COLUMN provider_metadata TEXT DEFAULT '{}'`); } catch { /* column already exists */ }

  // Migrate mendix_version data to provider_metadata in branches
  try {
    db.run(`
      UPDATE branches
      SET provider_metadata = json_object('mendixVersion', mendix_version)
      WHERE mendix_version IS NOT NULL AND provider_metadata = '{}'
    `);
  } catch { /* json_object may not be available or data already migrated */ }

  // Add provider_metadata to commits (replacing mendix_version + related_stories)
  try { db.run(`ALTER TABLE commits ADD COLUMN provider_metadata TEXT DEFAULT '{}'`); } catch { /* column already exists */ }

  // Migrate mendix_version and related_stories to provider_metadata in commits
  try {
    db.run(`
      UPDATE commits
      SET provider_metadata = json_object('mendixVersion', mendix_version, 'relatedStories', json(related_stories))
      WHERE mendix_version IS NOT NULL AND provider_metadata = '{}'
    `);
  } catch { /* json functions may not be available or data already migrated */ }
}

/**
 * Encrypt any plaintext PATs that exist from before the encryption feature.
 */
function migrateEncryptPats(db: Database): void {
  try {
    const stmt = db.prepare('SELECT app_id, pat FROM apps WHERE pat IS NOT NULL');
    const updates: Array<{ appId: string; encrypted: string }> = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const pat = row.pat as string;
      if (pat && !isEncrypted(pat)) {
        updates.push({ appId: row.app_id as string, encrypted: encrypt(pat) });
      }
    }
    stmt.free();
    for (const { appId, encrypted } of updates) {
      db.run('UPDATE apps SET pat = ? WHERE app_id = ?', [encrypted, appId]);
    }
  } catch {
    /* encryption migration may fail if encryption key not yet configured */
  }
}
