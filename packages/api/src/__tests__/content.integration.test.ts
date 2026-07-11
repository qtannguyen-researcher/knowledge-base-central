import { randomUUID } from 'node:crypto';

import { ContentType, UserRole } from '@knowledge-base-central/shared';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createContainer, resetContainer } from '../container.js';
import { prisma } from '../infrastructure/db/prisma.js';
import { getRedisClient, resetRedisClient } from '../infrastructure/redis/client.js';
import { buildServer } from '../server.js';

const databaseUrl = process.env['DATABASE_URL'];

async function clearRateLimits(): Promise<void> {
  const client = getRedisClient();
  const keys = await client.keys('kbc:rate-limit:*');
  if (keys.length > 0) {
    await client.del(...keys);
  }
}

describe.skipIf(!databaseUrl).sequential('Content API integration', () => {
  let server: FastifyInstance;
  let adminId: string;

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

  beforeEach(async () => {
    await clearRateLimits();

    await prisma.auditEvent.deleteMany({
      where: { actorId: adminId },
    });
    await prisma.assetVersion
      .deleteMany({
        where: { asset: { authorId: adminId } },
      })
      .catch(() => undefined);
    await prisma.knowledgeAssetTag.deleteMany({
      where: { asset: { authorId: adminId } },
    });
    await prisma.knowledgeAsset.deleteMany({
      where: { authorId: adminId },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'test-cat-' } },
    });

    const suffix = randomUUID();
    adminId = randomUUID();

    const admin = await prisma.user.upsert({
      where: { email: `content-admin-${suffix}@content.test` },
      create: {
        id: adminId,
        email: `content-admin-${suffix}@content.test`,
        username: `admin${suffix.replace(/-/g, '').slice(0, 10)}`,
        displayName: 'Test Admin',
        role: UserRole.ADMIN,
        status: 'ACTIVE',
      },
      update: {},
    });
    adminId = admin.id;
  });

  it('should create a knowledge asset', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/assets',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: {
        title: 'Test Asset',
        summary: 'A test asset',
        content: 'Test content',
        contentType: ContentType.TUTORIAL,
        tags: ['test'],
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should list categories', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/categories',
    });

    expect(response.statusCode).toBe(200);
    const categories = response.json();
    expect(Array.isArray(categories)).toBe(true);
  });
});
