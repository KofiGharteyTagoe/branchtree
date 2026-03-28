import type { Database } from 'sql.js';
import { logger } from '../utils/logger.js';

function safeAlter(db: Database, sql: string): void {
  try {
    db.run(sql);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('duplicate column') && !msg.includes('already exists')) {
      logger.warn({ err: msg, sql }, 'Migration warning');
    }
  }
}

function safeRun(db: Database, sql: string): void {
  try {
    db.run(sql);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already') && !msg.includes('no such column')) {
      logger.warn({ err: msg }, 'Migration data migration warning');
    }
  }
}

export function initializeDatabase(db: Database): void {
  // Settings table — key/value store for all app configuration
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      is_secret INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      oauth_provider TEXT NOT NULL DEFAULT 'local',
      oauth_id TEXT NOT NULL DEFAULT '',
      password_hash TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
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

  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      category TEXT NOT NULL DEFAULT 'general',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_branches_app_id ON branches(app_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_commits_app_id ON commits(app_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_merge_events_app_id ON merge_events(app_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`);

  // Additional performance indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_apps_owner_id ON apps(owner_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_commits_author_email ON commits(author_email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_commits_commit_date ON commits(commit_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_branches_app_name ON branches(app_id, name)`);

  // Audit log table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)`);

  // Migrations for existing databases — safe to run multiple times (ALTER TABLE IF NOT EXISTS)
  migrateToProviderSchema(db);
  migrateUserSchema(db);
  migrateUserRestrictions(db);
}

/**
 * Migrate existing databases from Mendix-specific columns to provider-agnostic schema.
 * Uses try/catch because SQLite doesn't support IF NOT EXISTS for ALTER TABLE.
 */
function migrateToProviderSchema(db: Database): void {
  safeAlter(db, `ALTER TABLE apps ADD COLUMN owner_id INTEGER REFERENCES users(id)`);
  safeAlter(db, `ALTER TABLE apps ADD COLUMN provider_type TEXT NOT NULL DEFAULT 'mendix'`);
  safeAlter(db, `ALTER TABLE branches ADD COLUMN provider_metadata TEXT DEFAULT '{}'`);

  safeRun(
    db,
    `
    UPDATE branches
    SET provider_metadata = json_object('mendixVersion', mendix_version)
    WHERE mendix_version IS NOT NULL AND provider_metadata = '{}'
  `,
  );

  safeAlter(db, `ALTER TABLE commits ADD COLUMN provider_metadata TEXT DEFAULT '{}'`);

  safeRun(
    db,
    `
    UPDATE commits
    SET provider_metadata = json_object('mendixVersion', mendix_version, 'relatedStories', json(related_stories))
    WHERE mendix_version IS NOT NULL AND provider_metadata = '{}'
  `,
  );
}

/**
 * Add admin and local-auth columns to users table.
 */
function migrateUserSchema(db: Database): void {
  safeAlter(db, `ALTER TABLE users ADD COLUMN password_hash TEXT`);
  safeAlter(db, `ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`);
}

/**
 * Add restriction columns to users table.
 */
function migrateUserRestrictions(db: Database): void {
  safeAlter(db, `ALTER TABLE users ADD COLUMN is_restricted INTEGER NOT NULL DEFAULT 0`);
  safeAlter(db, `ALTER TABLE users ADD COLUMN restriction_reason TEXT`);
}
