import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsOptions } from './config/cors.js';
import { requestId } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// Disable ETag to prevent response fingerprinting in logs/caches
app.set('etag', false);

// Remove X-Powered-By (helmet does this too, but belt & braces)
app.disable('x-powered-by');

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind injects inline styles
        imgSrc: ["'self'", 'data:', 'https:'], // avatars from OAuth providers
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  }),
);

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

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.resolve(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Error handling (must be last)
app.use(errorHandler);
