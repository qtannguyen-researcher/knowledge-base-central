import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { getRedisClient } from '../infrastructure/redis/client.js';
import { logger } from '../config/logger.js';
import { recordRateLimitHit } from '../infrastructure/metrics/MetricsCollector.js';

export async function registerRateLimitPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyRateLimit, {
    global: false,
    redis: getRedisClient(),
    nameSpace: 'kbc:rate-limit:',
    onExceeding: (request, key) => {
      logger.warn(
        {
          event: 'rate_limit',
          ip: request.ip,
          route: request.url,
          key,
        },
        'Rate limit approaching',
      );
    },
    onExceeded: (request, key) => {
      logger.warn(
        {
          event: 'rate_limit',
          ip: request.ip,
          route: request.url,
          key,
        },
        'Rate limit exceeded',
      );
      recordRateLimitHit(request.url);
    },
  });
}
