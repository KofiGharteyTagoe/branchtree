import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { config } from './env.js';
import { initializeDatabase } from '../db/schema.js';

let db: Database | null = null;
let dirty = false;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export async function initDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Ensure the data directory exists
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database or create new
  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Initialize tables
  initializeDatabase(db);

  // Save to disk
  saveDatabaseSync();

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

/**
 * Mark the database as dirty and schedule a debounced write.
 * This avoids blocking the event loop with synchronous writes on every mutation.
 */
export function saveDatabase(): void {
  if (!db) return;
  dirty = true;
  if (!saveTimeout) {
    saveTimeout = setTimeout(() => {
      flushDatabase();
    }, 1000);
  }
}

/**
 * Immediately flush the database to disk if dirty.
 * Call after batch operations (e.g., sync) to ensure data is persisted.
 */
export function flushDatabase(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (!db || !dirty) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
  dirty = false;
}

/**
 * Synchronous save — used during initialization and shutdown.
 */
export function saveDatabaseSync(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(config.dbPath, buffer);
  dirty = false;
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabaseSync();
    db.close();
    db = null;
  }
}
