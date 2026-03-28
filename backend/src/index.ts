import { config, validateEnvironment } from './config/env.js';
import { initDb, closeDatabase } from './config/database.js';
import { app } from './app.js';
import { startScheduler, stopScheduler } from './services/scheduler.service.js';
import * as settings from './models/settings.model.js';
import { getCorsOrigin, getSyncIntervalMinutes } from './config/runtimeConfig.js';
import { logger } from './utils/logger.js';
import fs from 'fs';
import path from 'path';

async function main() {
  // Validate environment before anything else
  validateEnvironment();

  // Initialize database
  await initDb();
  logger.info('Database initialized.');

  // Initialize default settings (auto-generates crypto secrets on first run)
  const setupToken = settings.initializeDefaults();

  // Migrate any legacy plaintext secrets to encrypted format
  settings.migrateUnencryptedSecrets();

  if (setupToken) {
    // Write setup token to a file instead of logging it
    const tokenFilePath = path.join(config.dataDir, '.setup-token');
    fs.writeFileSync(tokenFilePath, setupToken, { mode: 0o600 });

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('  FIRST-RUN SETUP REQUIRED');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('  Open the app in your browser and use the setup token to');
    logger.info('  create your admin account.');
    logger.info('');
    logger.info(`  Setup token saved to: ${tokenFilePath}`);
    logger.info('');
    logger.info('  This token can only be used once and will be deleted');
    logger.info('  after setup is complete.');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
  }

  // Start scheduler for periodic syncs
  startScheduler();

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(`BranchTree API running on port ${config.port}`);
    logger.info(`CORS origin: ${getCorsOrigin()}`);
    logger.info(`Data directory: ${config.dataDir}`);
    logger.info(`Sync interval: every ${getSyncIntervalMinutes()} minutes`);
    logger.info(`Setup complete: ${settings.isSetupComplete()}`);
  });

  // Graceful shutdown
  function gracefulShutdown(signal: string) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    stopScheduler();
    server.close(() => {
      closeDatabase();
      logger.info('Server closed.');
      process.exit(0);
    });
    // Force exit after 10 seconds if graceful shutdown stalls
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit.');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled rejection');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
