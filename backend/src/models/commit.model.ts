import { getDatabase, saveDatabase } from '../config/database.js';
import type { CommitRow } from '../types/db.types.js';
import type { ParsedCommit } from '../types/git.types.js';

function rowToCommit(row: Record<string, unknown>): CommitRow {
  return {
    hash: row.hash as string,
    app_id: row.app_id as string,
    author_name: row.author_name as string | null,
    author_email: row.author_email as string | null,
    commit_date: row.commit_date as string | null,
    message: row.message as string | null,
    parent_hashes: (row.parent_hashes as string) || '[]',
    is_merge_commit: (row.is_merge_commit as number) || 0,
    branch_names: (row.branch_names as string) || '[]',
    ref_names: row.ref_names as string | null,
    provider_metadata: (row.provider_metadata as string) || '{}',
  };
}

export function upsertCommits(appId: string, commits: ParsedCommit[]): void {
  const db = getDatabase();
  for (const commit of commits) {
    db.run(
      `INSERT INTO commits (
        hash, app_id, author_name, author_email, commit_date,
        message, parent_hashes, is_merge_commit, ref_names
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(hash, app_id) DO UPDATE SET
        author_name = excluded.author_name,
        author_email = excluded.author_email,
        commit_date = excluded.commit_date,
        message = excluded.message,
        parent_hashes = excluded.parent_hashes,
        is_merge_commit = excluded.is_merge_commit,
        ref_names = excluded.ref_names`,
      [
        commit.hash,
        appId,
        commit.authorName,
        commit.authorEmail,
        commit.date,
        commit.message,
        JSON.stringify(commit.parentHashes),
        commit.isMergeCommit ? 1 : 0,
        commit.refs,
      ],
    );
  }
  saveDatabase();
}

export function getCommits(appId: string): CommitRow[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM commits WHERE app_id = ? ORDER BY commit_date DESC');
  stmt.bind([appId]);
  const rows: CommitRow[] = [];
  while (stmt.step()) {
    rows.push(rowToCommit(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

export interface CommitQueryOptions {
  since?: string;
  until?: string;
  limit?: number;
}

export function getCommitsPaginated(appId: string, options: CommitQueryOptions): CommitRow[] {
  const db = getDatabase();
  const conditions = ['app_id = ?'];
  const params: (string | number)[] = [appId];

  if (options.since) {
    conditions.push('commit_date >= ?');
    params.push(options.since);
  }
  if (options.until) {
    conditions.push('commit_date <= ?');
    params.push(options.until);
  }

  let sql = `SELECT * FROM commits WHERE ${conditions.join(' AND ')} ORDER BY commit_date DESC`;
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: CommitRow[] = [];
  while (stmt.step()) {
    rows.push(rowToCommit(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

export function getCommitCount(appId: string): number {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as cnt FROM commits WHERE app_id = ?');
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return (row.cnt as number) || 0;
  }
  stmt.free();
  return 0;
}

export function getCommitDateRange(appId: string): {
  oldest: string | null;
  newest: string | null;
} {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT MIN(commit_date) as oldest, MAX(commit_date) as newest FROM commits WHERE app_id = ?',
  );
  stmt.bind([appId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      oldest: (row.oldest as string) || null,
      newest: (row.newest as string) || null,
    };
  }
  stmt.free();
  return { oldest: null, newest: null };
}

export function getCommitsByBranch(appId: string, branchName: string): CommitRow[] {
  const db = getDatabase();
  const stmt = db.prepare(
    `SELECT * FROM commits
     WHERE app_id = ? AND branch_names LIKE ?
     ORDER BY commit_date DESC`,
  );
  stmt.bind([appId, `%"${branchName}"%`]);
  const rows: CommitRow[] = [];
  while (stmt.step()) {
    rows.push(rowToCommit(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

export function enrichCommit(
  appId: string,
  hash: string,
  providerMetadata: Record<string, unknown>,
): void {
  const db = getDatabase();
  db.run(
    `UPDATE commits
     SET provider_metadata = ?
     WHERE hash = ? AND app_id = ?`,
    [JSON.stringify(providerMetadata), hash, appId],
  );
  saveDatabase();
}

export function clearCommits(appId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM commits WHERE app_id = ?', [appId]);
  saveDatabase();
}
