import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getMetrics, getContentType } from './MetricsCollector.js';
import { logger } from '../../config/logger.js';

const METRICS_TOKEN = process.env.METRICS_TOKEN || '';

async function metricsAuthHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!METRICS_TOKEN) {
    const clientIp = request.ip;
    const isLocalhost =
      clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';

    if (!isLocalhost) {
      logger.warn({ ip: clientIp }, 'Metrics endpoint access denied - no token configured');
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ ip: request.ip }, 'Metrics endpoint access denied - missing bearer token');
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  if (token !== METRICS_TOKEN) {
    logger.warn({ ip: request.ip }, 'Metrics endpoint access denied - invalid token');
    return reply.status(403).send({ error: 'Forbidden' });
  }
}

export async function createMetricsRoute(server: FastifyInstance): Promise<void> {
  server.get('/metrics', { preHandler: metricsAuthHook }, async (request, reply) => {
    const metrics = await getMetrics();
    return reply.header('Content-Type', getContentType()).send(metrics);
  });
}
