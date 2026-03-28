import { CorsOptions } from 'cors';
import { config } from './env.js';

export const corsOptions: CorsOptions = {
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
