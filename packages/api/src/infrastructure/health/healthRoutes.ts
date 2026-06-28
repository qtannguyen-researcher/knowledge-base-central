import type { FastifyInstance } from 'fastify';
import { getRedisClient } from '../redis/client.js';
import { logger } from '../../config/logger.js';

export interface HealthRoutesOptions {
  checkPostgresHealth: () => Promise<boolean>;
  checkRedisHealth: () => Promise<boolean>;
}

export async function createHealthRoutes(
  server: FastifyInstance,
  options: HealthRoutesOptions,
): Promise<void> {
  const startTime = Date.now();

  server.get('/health', async () => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const version = process.env.npm_package_version || '1.0.0';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      uptime,
    };
  });

  server.get('/health/ready', async (request, reply) => {
    const [postgresOk, redisOk] = await Promise.all([
      options.checkPostgresHealth().catch(() => false),
      options.checkRedisHealth().catch(() => false),
    ]);

    const checks = {
      postgres: postgresOk,
      redis: redisOk,
    };

    if (!postgresOk || !redisOk) {
      request.log.warn({ checks }, 'Health check failed');
      return reply.status(503).send({
        status: 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  });

  server.get('/health/live', async () => {
    return { status: 'alive', timestamp: new Date().toISOString() };
  });
}

export async function checkPostgresHealth(): Promise<boolean> {
  try {
    const { getContainer } = await import('../../container.js');
    const container = getContainer();
    await container.prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn({ error }, 'Postgres health check failed');
    return false;
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    logger.warn({ error }, 'Redis health check failed');
    return false;
  }
}
