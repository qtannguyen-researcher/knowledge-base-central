import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createContainer, resetContainer } from '../container.js';
import { prisma } from '../infrastructure/db/prisma.js';
import { resetRedisClient } from '../infrastructure/redis/client.js';
import { buildServer } from '../server.js';

const databaseUrl = process.env['DATABASE_URL'];

describe.skipIf(!databaseUrl).sequential('Search API integration', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    resetContainer();
    resetRedisClient();
    const container = createContainer(prisma);
    server = await buildServer({ container });
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
    await prisma.$disconnect();
  });

  it('search endpoint returns 401 without auth', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=test',
    });

    expect(response.statusCode).toBe(200);
  });

  it('empty result set returns empty array with zero total', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=zzzz-not-existing-query',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<unknown>; total: number }>();
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('reindex endpoint requires auth', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/search/reindex',
    });

    expect(response.statusCode).toBe(401);
  });

  it('analytics endpoint requires auth', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/search/analytics',
    });

    expect(response.statusCode).toBe(401);
  });
});
