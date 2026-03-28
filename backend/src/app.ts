import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
});

const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Sync rate limit exceeded, please wait before syncing again' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/apps/:appId/sync', syncLimiter);

// Routes
app.use('/api', apiRouter);

// Error handling (must be last)
app.use(errorHandler);
