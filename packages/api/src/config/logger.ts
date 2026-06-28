import pino from 'pino';
import { config } from '../config.js';

const isProduction = config.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
  base: {
    env: config.NODE_ENV,
    nodeVersion: process.version,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'secret'],
    censor: '[REDACTED]',
  },
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export function getApplicationInfo() {
  const dbHost = extractHost(config.DATABASE_URL);
  return {
    environment: config.NODE_ENV,
    port: config.PORT,
    databaseHost: dbHost,
    nodeVersion: process.version,
  };
}

function extractHost(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return 'unknown';
  }
}
