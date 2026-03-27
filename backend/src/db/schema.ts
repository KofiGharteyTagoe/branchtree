import type { Database } from 'sql.js';

export function initializeDatabase(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS apps (
      app_id TEXT PRIMARY KEY,
      app_name TEXT,
      pat TEXT,
      repo_url TEXT,
      repo_type TEXT,
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
      mendix_version TEXT,
      commits_ahead_of_main INTEGER DEFAULT 0,
      commits_behind_main INTEGER DEFAULT 0,
      is_merged INTEGER DEFAULT 0,
      is_stale INTEGER DEFAULT 0,
      branch_type TEXT,
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
      mendix_version TEXT,
      related_stories TEXT DEFAULT '[]',
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
}
