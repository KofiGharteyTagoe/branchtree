import { getDatabase, saveDatabase } from '../config/database.js';
import type { FeedbackRow } from '../types/db.types.js';

function rowToFeedback(row: Record<string, unknown>): FeedbackRow {
  return {
    id: row.id as number,
    user_id: row.user_id as number,
    category: row.category as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as string,
    admin_notes: row.admin_notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

/**
 * Create a new feedback entry.
 */
export function createFeedback(
  userId: number,
  category: string,
  title: string,
  description: string,
): FeedbackRow {
  const db = getDatabase();
  db.run(
    `INSERT INTO feedback (user_id, category, title, description)
     VALUES (?, ?, ?, ?)`,
    [userId, category, title, description],
  );
  saveDatabase();

  // Get the inserted row
  const stmt = db.prepare('SELECT * FROM feedback WHERE id = last_insert_rowid()');
  stmt.step();
  const row = rowToFeedback(stmt.getAsObject());
  stmt.free();
  return row;
}

/**
 * Get feedback submitted by a specific user.
 */
export function getFeedbackByUser(userId: number): FeedbackRow[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC');
  stmt.bind([userId]);
  const rows: FeedbackRow[] = [];
  while (stmt.step()) {
    rows.push(rowToFeedback(stmt.getAsObject()));
  }
  stmt.free();
  return rows;
}

/**
 * Get all feedback (admin view) with user info.
 */
export function getAllFeedback(): Array<
  FeedbackRow & { user_email: string; user_display_name: string | null }
> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT f.*, u.email as user_email, u.display_name as user_display_name
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    ORDER BY
      CASE f.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
      f.created_at DESC
  `);
  const rows: Array<FeedbackRow & { user_email: string; user_display_name: string | null }> = [];
  while (stmt.step()) {
    const raw = stmt.getAsObject();
    rows.push({
      ...rowToFeedback(raw),
      user_email: raw.user_email as string,
      user_display_name: raw.user_display_name as string | null,
    });
  }
  stmt.free();
  return rows;
}

/**
 * Update feedback status and admin notes.
 */
export function updateFeedback(
  feedbackId: number,
  status: string,
  adminNotes?: string | null,
): FeedbackRow | undefined {
  const db = getDatabase();
  db.run(
    `UPDATE feedback SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, adminNotes ?? null, feedbackId],
  );
  saveDatabase();

  const stmt = db.prepare('SELECT * FROM feedback WHERE id = ?');
  stmt.bind([feedbackId]);
  if (stmt.step()) {
    const row = rowToFeedback(stmt.getAsObject());
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

/**
 * Delete a feedback entry.
 */
export function deleteFeedback(feedbackId: number): void {
  const db = getDatabase();
  db.run('DELETE FROM feedback WHERE id = ?', [feedbackId]);
  saveDatabase();
}
