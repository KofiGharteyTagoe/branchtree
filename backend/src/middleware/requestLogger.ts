import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as import('express').Request).id,
  autoLogging: {
    ignore: (req) => req.url === '/api/health', // Don't log health checks
  },
});
