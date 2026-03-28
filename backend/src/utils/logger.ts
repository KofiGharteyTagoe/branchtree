import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // In production, strip hostname and pid to avoid leaking infra details
  base: isProduction ? { service: 'branchtree' } : undefined,
  // Redact any sensitive paths that accidentally end up in log objects
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      'password',
      'token',
      'secret',
    ],
    censor: '[REDACTED]',
  },
  ...(!isProduction && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
    },
  }),
});
