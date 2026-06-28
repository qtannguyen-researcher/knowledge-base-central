import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../server.js';
import type { FastifyInstance } from 'fastify';

describe('GET /health', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('returns 200 with status ok', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = response.json<{ status: string; timestamp: string }>();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });
});
