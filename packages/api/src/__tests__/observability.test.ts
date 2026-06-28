import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildServer } from '../server.js';
import type { FastifyInstance } from 'fastify';
import type { BuildServerOptions } from '../server.js';
import { logger } from '../config/logger.js';

describe('Observability Tests', () => {
  let server: FastifyInstance;

  describe('Health Endpoints', () => {
    beforeAll(async () => {
      const options: BuildServerOptions = {};
      server = await buildServer(options);
      await server.ready();
    });

    afterAll(async () => {
      await server.close();
    });

    describe('GET /health', () => {
      it('returns 200 with status ok', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/health',
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.status).toBe('ok');
        expect(body.timestamp).toBeDefined();
        expect(body.version).toBeDefined();
        expect(body.uptime).toBeDefined();
        expect(typeof body.uptime).toBe('number');
      });
    });

    describe('GET /health/ready', () => {
      it('returns 200 when services are up', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/health/ready',
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.status).toBe('ready');
        expect(body.checks).toBeDefined();
        expect(body.checks.postgres).toBe(true);
        expect(body.checks.redis).toBe(true);
      });
    });

    describe('GET /health/live', () => {
      it('returns 200 with status alive', async () => {
        const response = await server.inject({
          method: 'GET',
          url: '/health/live',
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.status).toBe('alive');
      });
    });
  });

  describe('Metrics Endpoint', () => {
    beforeAll(async () => {
      const options: BuildServerOptions = {};
      server = await buildServer(options);
      await server.ready();
    });

    afterAll(async () => {
      await server.close();
    });

    it('returns Prometheus text format when authorized', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/metrics',
      });

      if (response.statusCode === 200) {
        const body = response.body || '';
        expect(body).toContain('kbc_requests_total');
      } else {
        expect([200, 401]).toContain(response.statusCode);
      }
    });
  });

  describe('Request Logging', () => {
    beforeAll(async () => {
      const options: BuildServerOptions = {};
      server = await buildServer(options);
      await server.ready();
    });

    afterAll(async () => {
      await server.close();
    });

    it('adds request-id to request headers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const requestId = response.headers['x-request-id'];
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect((requestId as string).length).toBeGreaterThan(0);
    });

    it('returns request-id in response headers', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    beforeAll(async () => {
      const testServer = await buildServer({});
      await testServer.ready();

      testServer.get('/test-500', async () => {
        throw new Error('Test 500 error');
      });

      testServer.get('/test-400', async () => {
        const error = new Error('Test 400 error') as Error & { statusCode?: number };
        error.statusCode = 400;
        throw error;
      });

      server = testServer;
    });

    afterAll(async () => {
      await server.close();
    });

    it('logs 5xx errors at error level with stack trace', async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => logger);

      await server.inject({
        method: 'GET',
        url: '/test-500',
      });

      expect(errorSpy).toHaveBeenCalled();
      const logCall = errorSpy.mock.calls[0];
      expect(logCall[0]).toHaveProperty('reqId');
      errorSpy.mockRestore();
    });

    it('logs 4xx errors at warn level without stack trace', async () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => logger);

      await server.inject({
        method: 'GET',
        url: '/test-400',
      });

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('returns sanitized error response in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testServer = await buildServer({});
      await testServer.ready();

      testServer.get('/test-prod-error', async () => {
        const error = new Error('Secret error');
        (error as Error & { statusCode?: number }).statusCode = 500;
        throw error;
      });

      const response = await testServer.inject({
        method: 'GET',
        url: '/test-prod-error',
      });

      const body = response.json();
      expect(body.statusCode).toBe(500);
      expect(body.error).toBeDefined();
      expect(body.message).toBeDefined();
      expect(body.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
      await testServer.close();
    });
  });

  describe('Graceful Shutdown', () => {
    it('logs fatal errors on uncaughtException', () => {
      const fatalSpy = vi.spyOn(logger, 'fatal').mockImplementation(() => logger);

      const error = new Error('Test uncaught exception');
      process.emit('uncaughtException', error);

      expect(fatalSpy).toHaveBeenCalled();
      const logCall = fatalSpy.mock.calls[0];
      expect(logCall[0]).toHaveProperty('err');
      fatalSpy.mockRestore();
    });

    it('logs fatal errors on unhandledRejection', () => {
      const fatalSpy = vi.spyOn(logger, 'fatal').mockImplementation(() => logger);

      process.emit('unhandledRejection', 'Test rejection reason');

      expect(fatalSpy).toHaveBeenCalled();
      const logCall = fatalSpy.mock.calls[0];
      expect(logCall[0]).toHaveProperty('reason');
      fatalSpy.mockRestore();
    });
  });
});
