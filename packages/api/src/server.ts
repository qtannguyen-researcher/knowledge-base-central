import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import './auth/session.types.js';
import { config } from './config.js';
import { logger, getApplicationInfo } from './config/logger.js';
import { createContainer, getContainer, type Container } from './container.js';
import { registerDelivery } from './delivery/index.js';
import { closeRedisClient } from './infrastructure/redis/client.js';
import { registerCsrfPlugin } from './plugins/csrf.js';
import { registerOAuthRoutes, registerPassportPlugin } from './plugins/passport.js';
import { registerRateLimitPlugin } from './plugins/rateLimit.js';
import { registerSessionPlugin } from './plugins/session.js';
import { registerAuthRoutes } from './routes/auth.js';
import { createMetricsRoute } from './infrastructure/metrics/metricsRoute.js';

export interface BuildServerOptions {
  container?: Container;
}

export async function buildServer(options: BuildServerOptions = {}) {
  const log = (data: object) =>
    fetch('http://127.0.0.1:7376/ingest/ef960bb0-626c-4cf7-93ad-5d088341a8ff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9936d' },
      body: JSON.stringify({
        sessionId: 'a9936d',
        location: 'server.ts:23',
        message: 'buildServer entry',
        data,
        runId: 'initial',
        hypothesisId: 'A',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  log({ options: Object.keys(options || {}) });

  const container = options.container ?? getContainer();
  log({ containerType: container ? 'provided' : 'created' });

  // #region agent log
  const _dbg0 = (msg: string, data: object) =>
    fetch('http://127.0.0.1:7376/ingest/ef960bb0-626c-4cf7-93ad-5d088341a8ff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9936d' },
      body: JSON.stringify({
        sessionId: 'a9936d',
        location: 'server.ts',
        message: msg,
        data,
        runId: 'initial',
        hypothesisId: 'A',
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  // #endregion

  const server = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    pluginTimeout: 30000,
    genReqId: () => randomUUID(),
  });

  _dbg0('Fastify instance created', { genReqId: typeof randomUUID });

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

  _dbg0('Before multipart registration', {});
  await server.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });
  _dbg0('After multipart registration', {});

  _dbg0('Before registerSessionPlugin', {});
  await registerSessionPlugin(server);
  _dbg0('After registerSessionPlugin', {});

  _dbg0('Before registerRateLimitPlugin', {});
  await registerRateLimitPlugin(server);
  _dbg0('After registerRateLimitPlugin', {});

  _dbg0('Before registerCsrfPlugin', {});
  await registerCsrfPlugin(server);
  _dbg0('After registerCsrfPlugin', {});

  _dbg0('Before registerPassportPlugin', {});
  await registerPassportPlugin(server, container);
  _dbg0('After registerPassportPlugin', {});

  _dbg0('Before registerAuthRoutes', {});
  await registerAuthRoutes(server, container);
  _dbg0('After registerAuthRoutes', {});

  registerOAuthRoutes(server);
  _dbg0('After registerOAuthRoutes', {});

  _dbg0('Before registerDelivery', {});
  await registerDelivery(server, { container });
  _dbg0('After registerDelivery', {});

  _dbg0('Before createMetricsRoute', {});
  await createMetricsRoute(server);
  _dbg0('After createMetricsRoute', {});

  _dbg0('Before health routes import', {});
  const { checkPostgresHealth, checkRedisHealth, createHealthRoutes } =
    await import('./infrastructure/health/healthRoutes.js');
  _dbg0('After health routes import', {
    hasCheckPostgresHealth: !!checkPostgresHealth,
    hasCheckRedisHealth: !!checkRedisHealth,
    hasCreateHealthRoutes: !!createHealthRoutes,
  });

  _dbg0('Before createHealthRoutes', {});
  await createHealthRoutes(server, { checkPostgresHealth, checkRedisHealth });
  _dbg0('After createHealthRoutes', {});

  _dbg0('About to add onClose hook', {});

  server.addHook('onClose', async () => {
    await closeRedisClient();
  });

  // Synchronous debug log
  console.error('DEBUG: About to call getApplicationInfo');

  const appInfo = getApplicationInfo();
  console.error('DEBUG: Got appInfo, keys:', Object.keys(appInfo));

  console.error('DEBUG: Before logger.info call');
  logger.info(appInfo, 'Application starting');
  console.error('DEBUG: After logger.info call');

  _dbg0('buildServer returning', {});

  return server;
}

export { createContainer, getContainer };
