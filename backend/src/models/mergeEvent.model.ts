import { getDatabase, saveDatabase } from '../config/database.js';
import type { MergeEventRow } from '../types/db.types.js';

function rowToMergeEvent(row: Record<string, unknown>): MergeEventRow {
  return {
    id: row.id as number,
    app_id: row.app_id as string,
    merge_commit_hash: row.merge_commit_hash as string,
    source_branch: row.source_branch as string | null,
    target_branch: row.target_branch as string | null,
    merged_by: row.merged_by as string | null,
    merged_date: row.merged_date as string | null,
  };
}

export function upsertMergeEvent(
  appId: string,
  data: {
    mergeCommitHash: string;
    sourceBranch?: string;
    targetBranch?: string;
    mergedBy: string;
    mergedDate: string;
  }
): void {
  const db = getDatabase();
  // Check if already exists
  const stmt = db.prepare(
    'SELECT id FROM merge_events WHERE app_id = ? AND merge_commit_hash = ?'
  );
  stmt.bind([appId, data.mergeCommitHash]);
  const exists = stmt.step();
  stmt.free();

  if (!exists) {
    db.run(
      `INSERT INTO merge_events (
        app_id, merge_commit_hash, source_branch, target_branch,
        merged_by, merged_date
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        appId,
        data.mergeCommitHash,
        data.sourceBranch || null,
        data.targetBranch || null,
        data.mergedBy,
        data.mergedDate,
      ]
    );
    saveDatabase();
  }
}

export function getMergeEvents(appId: string): MergeEventRow[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM merge_events WHERE app_id = ? ORDER BY merged_date DESC'
  );
  stmt.bind([appId]);
  const rows: MergeEventRow[] = [];
  while (stmt.step()) {
    rows.push(rowToMergeEvent(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

export function clearMergeEvents(appId: string): void {
  const db = getDatabase();
  db.run('DELETE FROM merge_events WHERE app_id = ?', [appId]);
  saveDatabase();
}
