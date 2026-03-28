import { getDatabase, saveDatabase } from '../config/database.js';
import type { BranchRow } from '../types/db.types.js';
import type { BranchAnalysis } from '../types/git.types.js';

function rowToBranch(row: Record<string, unknown>): BranchRow {
  return {
    id: row.id as number,
    app_id: row.app_id as string,
    name: row.name as string,
    fork_point_commit: row.fork_point_commit as string | null,
    forked_from_branch: row.forked_from_branch as string | null,
    first_unique_commit: row.first_unique_commit as string | null,
    first_unique_commit_author: row.first_unique_commit_author as string | null,
    first_unique_commit_date: row.first_unique_commit_date as string | null,
    latest_commit_hash: row.latest_commit_hash as string | null,
    latest_commit_date: row.latest_commit_date as string | null,
    commits_ahead_of_main: (row.commits_ahead_of_main as number) || 0,
    commits_behind_main: (row.commits_behind_main as number) || 0,
    is_merged: (row.is_merged as number) || 0,
    is_stale: (row.is_stale as number) || 0,
    branch_type: row.branch_type as string | null,
    provider_metadata: (row.provider_metadata as string) || '{}',
  };
}

export function upsertBranch(appId: string, data: BranchAnalysis): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO branches (
      app_id, name, fork_point_commit, forked_from_branch,
      first_unique_commit, first_unique_commit_author, first_unique_commit_date,
      commits_ahead_of_main, commits_behind_main, is_merged, branch_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(app_id, name) DO UPDATE SET
      fork_point_commit = excluded.fork_point_commit,
      forked_from_branch = excluded.forked_from_branch,
      first_unique_commit = excluded.first_unique_commit,
      first_unique_commit_author = excluded.first_unique_commit_author,
      first_unique_commit_date = excluded.first_unique_commit_date,
      commits_ahead_of_main = excluded.commits_ahead_of_main,
      commits_behind_main = excluded.commits_behind_main,
      is_merged = excluded.is_merged,
      branch_type = excluded.branch_type`,
    [
      appId,
      data.name,
      data.forkPointCommit,
      data.forkedFromBranch,
      data.firstUniqueCommit?.hash || null,
      data.firstUniqueCommit?.author || null,
      data.firstUniqueCommit?.date || null,
      data.commitsAhead,
      data.commitsBehind,
      data.isMerged ? 1 : 0,
      data.branchType,
    ]
  );
  saveDatabase();
}

export function getBranches(appId: string): BranchRow[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM branches WHERE app_id = ? ORDER BY name');
  stmt.bind([appId]);
  const rows: BranchRow[] = [];
  while (stmt.step()) {
    rows.push(rowToBranch(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

export function getBranch(appId: string, name: string): BranchRow | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM branches WHERE app_id = ? AND name = ?');
  stmt.bind([appId, name]);
  if (stmt.step()) {
    const row = rowToBranch(stmt.getAsObject());
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

export function updateBranchProviderData(
  appId: string,
  name: string,
  data: {
    latestCommitHash?: string;
    latestCommitDate?: string;
    providerMetadata: Record<string, unknown>;
  }
): void {
  const db = getDatabase();
  const updates: string[] = ['provider_metadata = ?'];
  const params: unknown[] = [JSON.stringify(data.providerMetadata)];

  if (data.latestCommitHash) {
    updates.push('latest_commit_hash = ?');
    params.push(data.latestCommitHash);
  }
  if (data.latestCommitDate) {
    updates.push('latest_commit_date = ?');
    params.push(data.latestCommitDate);
  }

  params.push(appId, name);
  db.run(
    `UPDATE branches SET ${updates.join(', ')} WHERE app_id = ? AND name = ?`,
    params as (string | null)[]
  );
  saveDatabase();
}

export function updateStaleStatus(appId: string, name: string, isStale: boolean): void {
  const db = getDatabase();
  db.run('UPDATE branches SET is_stale = ? WHERE app_id = ? AND name = ?', [
    isStale ? 1 : 0,
    appId,
    name,
  ]);
  saveDatabase();
}

export function clearBranches(appId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM branches WHERE app_id = ?', [appId]);
  saveDatabase();
}
