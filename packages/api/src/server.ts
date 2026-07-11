import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { config } from './config.js';
import { logger, getApplicationInfo } from './config/logger.js';
import { createContainer, getContainer, type Container } from './container.js';
import { registerDelivery } from './delivery/index.js';
import { closeRedisClient } from './infrastructure/redis/client.js';
import { createMetricsRoute } from './infrastructure/metrics/metricsRoute.js';
import { registerRateLimitPlugin } from './plugins/rateLimit.js';

export interface BuildServerOptions {
  container?: Container;
}

export async function buildServer(options: BuildServerOptions = {}) {
  const container = options.container ?? getContainer();

  const server = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    pluginTimeout: 30000,
    genReqId: () => randomUUID(),
  });

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  server.addHook('onRequest', async (request) => {
    request.log.info(
      { reqId: request.id, method: request.method, url: request.url },
      'Incoming request',
    );
  });

  server.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        reqId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'Request completed',
    );
  });

  server.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;

    if (statusCode >= 500) {
      request.log.error(
        {
          reqId: request.id,
          err: error,
          method: request.method,
          url: request.url,
          statusCode,
        },
        'Server error',
      );
    } else {
      request.log.warn(
        {
          reqId: request.id,
          err: {
            message: error.message,
            statusCode,
          },
          method: request.method,
          url: request.url,
          statusCode,
        },
        'Client error',
      );
    }

    const response =
      config.NODE_ENV === 'production'
        ? { statusCode, error: error.name, message: error.message }
        : { statusCode, error: error.name, message: error.message, stack: error.stack };

    reply.status(statusCode).send(response);
  });

  await server.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await registerRateLimitPlugin(server);

  await registerDelivery(server, { container });

  await createMetricsRoute(server);

  const { checkPostgresHealth, checkRedisHealth, createHealthRoutes } =
    await import('./infrastructure/health/healthRoutes.js');

  await createHealthRoutes(server, { checkPostgresHealth, checkRedisHealth });

  server.addHook('onClose', async () => {
    await closeRedisClient();
  });

  logger.info(getApplicationInfo(), 'Application starting');

  return server;
}

export { createContainer, getContainer };
