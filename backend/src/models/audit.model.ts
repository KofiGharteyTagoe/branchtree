import { getDatabase, saveDatabase } from '../config/database.js';

export function logAction(
  userId: number | null,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: string,
): void {
  const db = getDatabase();
  db.run(
    `INSERT INTO audit_log (user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)`,
    [userId, action, targetType ?? null, targetId ?? null, details ?? null],
  );
  saveDatabase();
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: string | null;
  created_at: string;
}

export function getRecentLogs(limit = 100): AuditLogEntry[] {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`);
  stmt.bind([limit]);

  const results: AuditLogEntry[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as AuditLogEntry);
  }
  stmt.free();
  return results;
}
