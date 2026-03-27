import { Router } from 'express';
import * as appModel from '../models/app.model.js';
import { createApiError } from '../middleware/errorHandler.js';
import { validateAppId } from '../middleware/validateParams.js';
import type { ApiApp } from '../types/api.types.js';

export const appsRouter = Router();

// GET /api/apps — List all registered apps
appsRouter.get('/apps', (_req, res) => {
  const apps = appModel.getApps();
  const response: ApiApp[] = apps.map((app) => ({
    appId: app.app_id,
    appName: app.app_name,
    repoUrl: app.repo_url,
    repoType: app.repo_type,
    lastSynced: app.last_synced,
  }));
  res.json({ apps: response });
});

// POST /api/apps — Register a new app
appsRouter.post('/apps', (req, res, next) => {
  const { appId, appName, pat } = req.body;

  if (!appId || typeof appId !== 'string') {
    return next(createApiError('appId is required and must be a string', 400));
  }

  if (!pat || typeof pat !== 'string') {
    return next(createApiError('pat (Personal Access Token) is required', 400));
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(appId)) {
    return next(createApiError('appId must be a valid UUID', 400));
  }

  const app = appModel.createApp(appId, pat, appName);
  // Never return the PAT in the response
  res.status(201).json({
    appId: app.app_id,
    appName: app.app_name,
    repoUrl: app.repo_url,
    repoType: app.repo_type,
    lastSynced: app.last_synced,
    hasPat: true,
  });
});

// PUT /api/apps/:appId/pat — Update the PAT for an existing app
appsRouter.put('/apps/:appId/pat', validateAppId, (req, res, next) => {
  const { pat } = req.body;
  if (!pat || typeof pat !== 'string') {
    return next(createApiError('pat (Personal Access Token) is required', 400));
  }

  const app = appModel.getApp(req.params.appId);
  if (!app) {
    return next(createApiError('App not found', 404));
  }

  appModel.updateAppPat(req.params.appId, pat);
  res.json({ message: 'PAT updated successfully' });
});

// GET /api/apps/:appId — Get a single app
appsRouter.get('/apps/:appId', validateAppId, (req, res, next) => {
  const app = appModel.getApp(req.params.appId);
  if (!app) {
    return next(createApiError('App not found', 404));
  }
  res.json({
    appId: app.app_id,
    appName: app.app_name,
    repoUrl: app.repo_url,
    repoType: app.repo_type,
    lastSynced: app.last_synced,
  });
});

// DELETE /api/apps/:appId — Remove an app
appsRouter.delete('/apps/:appId', validateAppId, (req, res, next) => {
  const app = appModel.getApp(req.params.appId);
  if (!app) {
    return next(createApiError('App not found', 404));
  }
  appModel.deleteApp(req.params.appId);
  res.status(204).send();
});
