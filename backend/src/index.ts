import { config } from './config/env.js';
import { initDb } from './config/database.js';
import { app } from './app.js';
import { startScheduler } from './services/scheduler.service.js';

async function main() {
  // Initialize database
  await initDb();
  console.log('Database initialized.');

  // Start scheduler for periodic syncs
  startScheduler();

  // Start server
  app.listen(config.port, () => {
    console.log(`Mendix Branch Visualizer API running on port ${config.port}`);
    console.log(`CORS origin: ${config.corsOrigin}`);
    console.log(`Data directory: ${config.dataDir}`);
    console.log(`Sync interval: every ${config.syncIntervalMinutes} minutes`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
