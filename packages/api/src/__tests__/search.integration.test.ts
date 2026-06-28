import { randomUUID } from 'node:crypto';

import { ContentType, Difficulty, UserRole } from '@knowledge-base-central/shared';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { hashPassword } from '../auth/password.js';
import { createContainer, resetContainer } from '../container.js';
import { User } from '../domain/user/User.js';
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

function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

describe.skipIf(!databaseUrl).sequential('Search API integration', () => {
  let server: FastifyInstance;
  let adminCookie: string;

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

    await prisma.searchQueryLog.deleteMany();
    await prisma.knowledgeAssetTag.deleteMany({
      where: { asset: { author: { email: { contains: '@search.test' } } } },
    });
    await prisma.knowledgeAsset.deleteMany({
      where: { author: { email: { contains: '@search.test' } } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'search-cat-' } },
    });
    await prisma.tag.deleteMany({
      where: { slug: { startsWith: 'search-tag-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@search.test' } },
    });

    const adminEmail = `search-admin-${uniqueSlug('admin')}@search.test`;
    const admin = new User({
      id: randomUUID(),
      email: adminEmail,
      username: `searchadmin${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      passwordHash: await hashPassword('admin-pass-123'),
      role: UserRole.ADMIN,
      status: 'ACTIVE',
    });
    await createContainer(prisma).userRepository.save(admin);

    const adminLogin = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: adminEmail, password: 'admin-pass-123' },
    });
    adminCookie = adminLogin.cookies.find((c) => c.name === 'sessionId')!.value;
  });

  async function createCategory(slug: string, name: string) {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/categories',
      cookies: { sessionId: adminCookie },
      payload: { slug, name },
    });
    expect(response.statusCode).toBe(201);
    return response.json<{ id: string }>();
  }

  async function createTag(slug: string, name: string) {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/tags',
      cookies: { sessionId: adminCookie },
      payload: { slug, name },
    });
    expect(response.statusCode).toBe(201);
    return response.json<{ id: string }>();
  }

  async function createPublishedAsset(overrides: Record<string, unknown> = {}) {
    const category = overrides.categorySlug
      ? await createCategory(
          overrides.categorySlug,
          overrides.categoryName ?? overrides.categorySlug,
        )
      : null;
    const tag = overrides.tagSlug
      ? await createTag(overrides.tagSlug, overrides.tagName ?? overrides.tagSlug)
      : null;

    const payload = {
      title: overrides.title ?? `Asset ${randomUUID().slice(0, 6)}`,
      summary: overrides.summary ?? 'Search integration summary',
      contentType: overrides.contentType ?? ContentType.TUTORIAL,
      difficulty: overrides.difficulty ?? Difficulty.BEGINNER,
      tags: tag ? [tag.slug] : [],
      categoryId: category?.id ?? null,
      ...overrides,
    };

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/assets',
      cookies: { sessionId: adminCookie },
      payload,
    });
    expect(response.statusCode).toBe(201);
    const asset = response.json<{ id: string }>();

    await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${asset.id}/submit-review`,
      cookies: { sessionId: adminCookie },
    });
    await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${asset.id}/approve`,
      cookies: { sessionId: adminCookie },
    });
    const publish = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${asset.id}/publish`,
      cookies: { sessionId: adminCookie },
    });
    expect(publish.statusCode).toBe(200);
    return publish.json<{ id: string; slug: string }>();
  }

  it('exact title match returns expected article first', async () => {
    const published = await createPublishedAsset({ title: 'Neural Network Guide' });
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=Neural+Network+Guide',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<{ slug: string }> }>();
    expect(body.results[0].slug).toBe(published.slug);
  });

  it('partial word in content returns relevant articles', async () => {
    await createPublishedAsset({
      title: 'Deep Learning Foundations',
      summary: 'Introduction to neural networks and training',
    });
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=neural',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<{ title: string }> }>();
    expect(body.results.some((item) => item.title === 'Deep Learning Foundations')).toBe(true);
  });

  it('category filter limits results to that category only', async () => {
    await createPublishedAsset({
      title: 'Category Filtered',
      categorySlug: uniqueSlug('search-cat-a'),
      categoryName: uniqueSlug('search-cat-a'),
    });
    await createPublishedAsset({
      title: 'Other Category',
      categorySlug: uniqueSlug('search-cat-b'),
      categoryName: uniqueSlug('search-cat-b'),
    });

    const categoryASlug = uniqueSlug('search-cat-a');
    await createCategory(categoryASlug, categoryASlug);
    await createPublishedAsset({
      title: 'Category Filtered',
      categorySlug: categoryASlug,
      categoryName: categoryASlug,
    });
    const categoryBSlug = uniqueSlug('search-cat-b');
    await createCategory(categoryBSlug, categoryBSlug);
    await createPublishedAsset({
      title: 'Other Category',
      categorySlug: categoryBSlug,
      categoryName: categoryBSlug,
    });

    const response = await server.inject({
      method: 'GET',
      url: `/api/v1/search?q=Category+Filtered&category=${categoryASlug}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<{ title: string }> }>();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.every((item) => item.title === 'Category Filtered')).toBe(true);
  });

  it('tag filter limits results to articles with that tag', async () => {
    const tagSlug = uniqueSlug('search-tag-algorithms');
    await createTag(tagSlug, tagSlug);
    await createPublishedAsset({
      title: 'Tagged Asset',
      tagSlug,
      tagName: tagSlug,
    });
    await createPublishedAsset({ title: 'Untagged Asset' });

    const response = await server.inject({
      method: 'GET',
      url: `/api/v1/search?q=Asset&tag=${tagSlug}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<{ title: string }> }>();
    expect(body.results.some((item) => item.title === 'Tagged Asset')).toBe(true);
    expect(body.results.every((item) => item.title === 'Tagged Asset')).toBe(true);
  });

  it('difficulty filter returns only matching difficulty', async () => {
    await createPublishedAsset({
      title: 'Advanced Topic',
      difficulty: Difficulty.ADVANCED,
    });
    await createPublishedAsset({
      title: 'Beginner Topic',
      difficulty: Difficulty.BEGINNER,
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=Topic&difficulty=ADVANCED',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<{ title: string }> }>();
    expect(body.results.every((item) => item.title === 'Advanced Topic')).toBe(true);
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

  it('archived and deleted articles do not appear in results', async () => {
    const published = await createPublishedAsset({ title: 'Archived Asset' });

    await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${published.id}/archive`,
      cookies: { sessionId: adminCookie },
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=Archived+Asset',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ results: Array<{ slug: string }> }>();
    expect(body.results.some((item) => item.slug === published.slug)).toBe(false);
  });

  it('search analytics records queries and reports top terms', async () => {
    await server.inject({
      method: 'GET',
      url: '/api/v1/search?q=analytics',
    });

    const analytics = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/search/analytics',
      cookies: { sessionId: adminCookie },
    });

    expect(analytics.statusCode).toBe(200);
    const body = analytics.json<{ topQueries: Array<{ query: string }> }>();
    expect(body.topQueries.some((item) => item.query === 'analytics')).toBe(true);
  });

  it('reindex endpoint requires search:manage permission', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/search/reindex',
    });

    expect(response.statusCode).toBe(401);
  });

  it('reindex endpoint returns 202 with rebuilding flag', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/search/reindex',
      cookies: { sessionId: adminCookie },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json<{ rebuilding: boolean }>().rebuilding).toBe(true);
  });
});
