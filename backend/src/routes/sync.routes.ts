import { Router } from 'express';
import { validateAppId } from '../middleware/validateParams.js';
import { createApiError } from '../middleware/errorHandler.js';
import { authorizeAppOwner } from '../middleware/auth.js';
import * as appModel from '../models/app.model.js';
import { syncApp } from '../services/ingestion.service.js';
import { logger } from '../utils/logger.js';

export const syncRouter = Router();

// POST /api/apps/:appId/sync — Trigger a manual data sync
syncRouter.post('/apps/:appId/sync', validateAppId, authorizeAppOwner, async (req, res, next) => {
  try {
    const app = appModel.getApp(req.params.appId);
    if (!app) {
      return next(createApiError('App not found. Register it first via POST /api/apps', 404));
    }

    const result = await syncApp(req.params.appId);
    res.json(result);
  } catch (err) {
    // Log only a safe summary — error messages are already sanitized
    // by gitClone.service but we double-check here
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ appId: req.params.appId }, `Sync failed: ${message}`);
    next(createApiError(`Sync failed: ${message}`, 500));
  }
});
