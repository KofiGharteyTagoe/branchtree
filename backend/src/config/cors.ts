import type { CorsOptions } from 'cors';
import { getCorsOrigin } from './runtimeConfig.js';
import { logger } from '../utils/logger.js';

export const corsOptions: CorsOptions = {
  origin: (requestOrigin, callback) => {
    const allowed = getCorsOrigin();

    // Validate that the configured origin is a valid URL
    try {
      new URL(allowed);
    } catch {
      logger.error(
        `Invalid CORS origin configured: "${allowed}". Blocking all cross-origin requests.`,
      );
      return callback(new Error('Invalid CORS origin configured'));
    }

    // Allow requests with no origin (e.g., server-to-server, same-origin)
    if (!requestOrigin || requestOrigin === allowed) {
      callback(null, allowed);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
