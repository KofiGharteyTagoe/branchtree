import cron from 'node-cron';
import { getSyncIntervalMinutes } from '../config/runtimeConfig.js';
import * as appModel from '../models/app.model.js';
import { syncApp } from './ingestion.service.js';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the periodic sync scheduler.
 * Runs every N minutes (configured via SYNC_INTERVAL_MINUTES).
 */
export function startScheduler(): void {
  const minutes = getSyncIntervalMinutes();

  // node-cron format: "*/N * * * *" = every N minutes
  const cronExpression = `*/${minutes} * * * *`;

  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('Scheduled sync starting...');
    await syncAllApps();
  });

  console.log(`Scheduler started: syncing every ${minutes} minutes`);
}

/**
 * Stop the periodic sync scheduler.
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Scheduler stopped');
  }
}

/**
 * Sync all registered apps.
 */
async function syncAllApps(): Promise<void> {
  const apps = appModel.getApps();
  if (apps.length === 0) {
    console.log('No apps registered, skipping scheduled sync');
    return;
  }

  for (const app of apps) {
    try {
      await syncApp(app.app_id);
    } catch (err) {
      console.error(`Scheduled sync failed for app ${app.app_id}:`, err);
    }
  }
}
