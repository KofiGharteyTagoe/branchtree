import { Router } from 'express';
import * as appModel from '../models/app.model.js';
import { createApiError } from '../middleware/errorHandler.js';
import { validateAppId } from '../middleware/validateParams.js';
import { authorizeAppOwner } from '../middleware/auth.js';
import { getProvider, isValidProviderType } from '../providers/index.js';
import type { ApiApp } from '../types/api.types.js';
import type { ProviderType } from '../types/provider.types.js';

export const appsRouter = Router();

// GET /api/apps — List apps owned by the current user
appsRouter.get('/apps', (req, res) => {
  const apps = appModel.getApps(req.user!.userId);
  const response: ApiApp[] = apps.map((app) => ({
    appId: app.app_id,
    appName: app.app_name,
    repoUrl: app.repo_url,
    repoType: app.repo_type,
    providerType: app.provider_type,
    lastSynced: app.last_synced,
  }));
  res.json({ apps: response });
});

// POST /api/apps — Register a new app
appsRouter.post('/apps', (req, res, next) => {
  const { appId, appName, pat, providerType = 'mendix', repoUrl } = req.body;

  if (!appId || typeof appId !== 'string') {
    return next(createApiError('appId is required and must be a string', 400));
  }

  if (!pat || typeof pat !== 'string') {
    return next(createApiError('pat (credentials) is required', 400));
  }

  // Validate provider type
  const provType = (providerType as string) || 'mendix';
  if (!isValidProviderType(provType)) {
    return next(createApiError(`Invalid provider type: ${provType}. Valid types: mendix, github, gitlab, plain-git`, 400));
  }

  // Validate app ID format using the provider
  const provider = getProvider(provType as ProviderType);
  if (!provider.validateIdentifier(appId)) {
    return next(createApiError(`Invalid App ID format for ${provider.displayName} provider.`, 400));
  }

  // For providers without getRepoUrl (e.g., plain-git), repoUrl is required
  if (!provider.getRepoUrl && !repoUrl) {
    return next(createApiError('repoUrl is required for this provider type.', 400));
  }

  const app = appModel.createApp(appId, pat, provType as ProviderType, appName, repoUrl, req.user!.userId);
  // Never return the PAT in the response
  res.status(201).json({
    appId: app.app_id,
    appName: app.app_name,
    repoUrl: app.repo_url,
    repoType: app.repo_type,
    providerType: app.provider_type,
    lastSynced: app.last_synced,
    hasPat: true,
  });
});

// PUT /api/apps/:appId/pat — Update the PAT for an existing app
appsRouter.put('/apps/:appId/pat', validateAppId, authorizeAppOwner, (req, res, next) => {
  const { pat } = req.body;
  if (!pat || typeof pat !== 'string') {
    return next(createApiError('pat (credentials) is required', 400));
  }

  const app = appModel.getApp(req.params.appId);
  if (!app) {
    return next(createApiError('App not found', 404));
  }

  appModel.updateAppPat(req.params.appId, pat);
  res.json({ message: 'Credentials updated successfully' });
});

// GET /api/apps/:appId — Get a single app
appsRouter.get('/apps/:appId', validateAppId, authorizeAppOwner, (req, res, next) => {
  const app = appModel.getApp(req.params.appId);
  if (!app) {
    return next(createApiError('App not found', 404));
  }
  res.json({
    appId: app.app_id,
    appName: app.app_name,
    repoUrl: app.repo_url,
    repoType: app.repo_type,
    providerType: app.provider_type,
    lastSynced: app.last_synced,
  });
});

// DELETE /api/apps/:appId — Remove an app
appsRouter.delete('/apps/:appId', validateAppId, authorizeAppOwner, (req, res, next) => {
  const app = appModel.getApp(req.params.appId);
  if (!app) {
    return next(createApiError('App not found', 404));
  }
  appModel.deleteApp(req.params.appId);
  res.status(204).send();
});
