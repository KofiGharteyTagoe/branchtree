import { Router } from 'express';
import { getDatabase } from '../config/database.js';

export const healthRouter = Router();

// GET /api/health — Basic health check
healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'branchtree',
  });
});

// GET /api/health/live — Liveness probe (always returns 200 if process is running)
healthRouter.get('/health/live', (_req, res) => {
  res.json({ status: 'alive' });
});

// GET /api/health/ready — Readiness probe (checks database connectivity)
healthRouter.get('/health/ready', (_req, res) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT 1');
    if (result.length > 0) {
      res.json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not_ready', reason: 'database query returned no results' });
    }
  } catch (_err) {
    res.status(503).json({ status: 'not_ready', reason: 'database unavailable' });
  }
});

// GET /api/health/metrics — Basic metrics (admin use)
healthRouter.get('/health/metrics', (_req, res) => {
  try {
    const db = getDatabase();
    const mem = process.memoryUsage();

    const counts: Record<string, number> = {};
    for (const table of ['users', 'apps', 'branches', 'commits', 'feedback']) {
      const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = (result[0]?.values[0]?.[0] as number) ?? 0;
    }

    res.json({
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.floor(mem.rss / 1024 / 1024),
        heapUsed: Math.floor(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.floor(mem.heapTotal / 1024 / 1024),
      },
      counts,
    });
  } catch {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});
