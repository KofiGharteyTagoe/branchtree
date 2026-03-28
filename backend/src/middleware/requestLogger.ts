import pinoHttp from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../utils/logger.js';

// Headers that must never appear in logs (request)
const REDACTED_REQ_HEADERS = ['cookie', 'authorization'];
// Headers that must never appear in logs (response)
const REDACTED_RES_HEADERS = ['set-cookie', 'etag'];
const REDACT_PLACEHOLDER = '[REDACTED]';

// Request headers that are safe and useful to log — everything else is dropped
const ALLOWED_REQ_HEADERS = new Set([
  'host',
  'content-type',
  'content-length',
  'accept',
  'origin',
  'sec-fetch-site',
  'sec-fetch-mode',
]);

function pickSafeHeaders(
  headers: Record<string, string | string[] | undefined>,
  redactKeys: string[],
  allowList?: Set<string>,
): Record<string, string | string[] | typeof REDACT_PLACEHOLDER> {
  const safe: Record<string, string | string[] | typeof REDACT_PLACEHOLDER> = {};
  for (const [key, val] of Object.entries(headers)) {
    if (!val) continue;
    if (redactKeys.includes(key)) {
      safe[key] = REDACT_PLACEHOLDER;
    } else if (!allowList || allowList.has(key)) {
      safe[key] = val;
    }
    // If there's an allow-list and the key isn't in it, drop it silently
  }
  return safe;
}

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as import('express').Request).id,
  autoLogging: {
    ignore: (req) => req.url === '/api/health' || req.url === '/api/health/live',
  },
  serializers: {
    req(req: IncomingMessage & { id?: string; raw?: IncomingMessage }) {
      const raw = req.raw || req;
      return {
        id: req.id,
        method: raw.method,
        url: raw.url,
        headers: pickSafeHeaders(
          raw.headers as Record<string, string | string[] | undefined>,
          REDACTED_REQ_HEADERS,
          ALLOWED_REQ_HEADERS,
        ),
      };
    },
    res(res: ServerResponse & { raw?: ServerResponse }) {
      const raw = res.raw || res;
      const headers = (raw.getHeaders?.() || {}) as Record<string, string | string[] | undefined>;
      return {
        statusCode: raw.statusCode,
        headers: pickSafeHeaders(headers, REDACTED_RES_HEADERS),
      };
    },
  },
});
