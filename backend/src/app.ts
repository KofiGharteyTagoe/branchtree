import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const app = express();

// Disable ETag to prevent response fingerprinting in logs/caches
app.set('etag', false);

// Remove X-Powered-By (helmet does this too, but belt & braces)
app.disable('x-powered-by');

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(requestId);
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

// Request timeout (30s default)
app.use((req, _res, next) => {
  req.setTimeout(30_000);
  next();
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/apps/:appId/sync', syncLimiter);

// Routes
app.use('/api', apiRouter);

// Error handling (must be last)
app.use(errorHandler);
