import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { appsRouter } from './apps.routes.js';
import { syncRouter } from './sync.routes.js';
import { branchesRouter } from './branches.routes.js';
import { graphRouter } from './graph.routes.js';
import { mergesRouter } from './merges.routes.js';
import { authenticate } from '../middleware/auth.js';

export const apiRouter = Router();

// Public routes (no auth required)
apiRouter.use(healthRouter);
apiRouter.use(authRouter);

// Protected routes (require authentication)
apiRouter.use(authenticate);
apiRouter.use(appsRouter);
apiRouter.use(syncRouter);
apiRouter.use(branchesRouter);
apiRouter.use(graphRouter);
apiRouter.use(mergesRouter);
