import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function optionalInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

/**
 * Infrastructure config — only settings that define WHERE the app runs and stores data.
 * All secrets, credentials, and business settings are managed via the admin UI
 * and stored in the database settings table.
 */
export const config = {
  port: optionalInt('PORT', 3001),
  dataDir: path.resolve(backendRoot, optionalEnv('DATA_DIR', './data')),
  dbPath: path.resolve(backendRoot, optionalEnv('DB_PATH', './data/branchtree.sqlite')),
} as const;

export type Config = typeof config;
