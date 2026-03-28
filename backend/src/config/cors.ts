import type { CorsOptions } from 'cors';
import { getCorsOrigin } from './runtimeConfig.js';

export const corsOptions: CorsOptions = {
  origin: (_origin, callback) => {
    // Read from database on each request so it can be changed at runtime
    const allowed = getCorsOrigin();
    callback(null, allowed);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
