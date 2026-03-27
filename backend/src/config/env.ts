import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value === `your_personal_access_token_here`) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please copy backend/.env.example to backend/.env and fill in all values.\n` +
      `See docs/SETUP.md for detailed instructions.`
    );
  }
  return value;
}

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

export const config = {
  port: optionalInt('PORT', 3001),
  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),

  dataDir: path.resolve(backendRoot, optionalEnv('DATA_DIR', './data')),
  dbPath: path.resolve(backendRoot, optionalEnv('DB_PATH', './data/branchtree.sqlite')),

  syncIntervalMinutes: optionalInt('SYNC_INTERVAL_MINUTES', 15),
  staleBranchDays: optionalInt('STALE_BRANCH_DAYS', 30),
  divergenceThreshold: optionalInt('DIVERGENCE_THRESHOLD', 20),
} as const;

export type Config = typeof config;
