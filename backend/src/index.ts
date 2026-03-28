import { config } from './config/env.js';
import { initDb } from './config/database.js';
import { app } from './app.js';
import { startScheduler } from './services/scheduler.service.js';
import * as settings from './models/settings.model.js';
import { getCorsOrigin, getSyncIntervalMinutes } from './config/runtimeConfig.js';

async function main() {
  // Initialize database
  await initDb();
  console.log('Database initialized.');

  // Initialize default settings (auto-generates crypto secrets on first run)
  const setupToken = settings.initializeDefaults();

  if (setupToken) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  FIRST-RUN SETUP REQUIRED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Open the app in your browser and use this token to');
    console.log('  create your admin account:');
    console.log('');
    console.log(`  Setup Token: ${setupToken}`);
    console.log('');
    console.log('  This token can only be used once and will be deleted');
    console.log('  after setup is complete.');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  }

  // Start scheduler for periodic syncs
  startScheduler();

  // Start server
  app.listen(config.port, () => {
    console.log(`BranchTree API running on port ${config.port}`);
    console.log(`CORS origin: ${getCorsOrigin()}`);
    console.log(`Data directory: ${config.dataDir}`);
    console.log(`Sync interval: every ${getSyncIntervalMinutes()} minutes`);
    console.log(`Setup complete: ${settings.isSetupComplete()}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
