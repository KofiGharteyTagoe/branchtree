import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { appsRouter } from './apps.routes.js';
import { syncRouter } from './sync.routes.js';
import { branchesRouter } from './branches.routes.js';
import { graphRouter } from './graph.routes.js';
import { mergesRouter } from './merges.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(appsRouter);
apiRouter.use(syncRouter);
apiRouter.use(branchesRouter);
apiRouter.use(graphRouter);
apiRouter.use(mergesRouter);
