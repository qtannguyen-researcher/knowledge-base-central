import { randomUUID } from 'node:crypto';

import { ContentType, UserRole } from '@knowledge-base-central/shared';
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

describe.skipIf(!databaseUrl).sequential('Content API integration', () => {
  let server: FastifyInstance;
  let adminCookie: string;
  let contributorCookie: string;
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

    const suffix = randomUUID();
    const adminEmail = `content-admin-${suffix}@content.test`;
    const contributorEmail = `content-contrib-${suffix}@content.test`;

    await prisma.auditEvent.deleteMany({
      where: { actor: { email: { contains: '@content.test' } } },
    });
    await prisma.assetVersion
      .deleteMany({
        where: { asset: { author: { email: { contains: '@content.test' } } } },
      })
      .catch(() => undefined);
    await prisma.knowledgeAssetTag.deleteMany({
      where: { asset: { author: { email: { contains: '@content.test' } } } },
    });
    await prisma.knowledgeAsset.deleteMany({
      where: { author: { email: { contains: '@content.test' } } },
    });
    await prisma.category.deleteMany({
      where: { slug: { startsWith: 'test-cat-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@content.test' } },
    });

    const admin = new User({
      id: randomUUID(),
      email: adminEmail,
      username: `admin${suffix.replace(/-/g, '').slice(0, 10)}`,
      passwordHash: await hashPassword('admin-pass-123'),
      role: UserRole.ADMIN,
      status: 'ACTIVE',
    });
    adminId = admin.id;
    await createContainer(prisma).userRepository.save(admin);

    const contributor = new User({
      id: randomUUID(),
      email: contributorEmail,
      username: `contrib${suffix.replace(/-/g, '').slice(0, 10)}`,
      passwordHash: await hashPassword('contrib-pass-123'),
      role: UserRole.CONTRIBUTOR,
      status: 'ACTIVE',
    });
    await createContainer(prisma).userRepository.save(contributor);

    const adminLogin = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: adminEmail, password: 'admin-pass-123' },
    });
    adminCookie = adminLogin.cookies.find((c) => c.name === 'sessionId')!.value;

    const contribLogin = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: contributorEmail, password: 'contrib-pass-123' },
    });
    contributorCookie = contribLogin.cookies.find((c) => c.name === 'sessionId')!.value;
  });

  async function createAssetAsAdmin(overrides: Record<string, unknown> = {}) {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/assets',
      cookies: { sessionId: adminCookie },
      payload: {
        title: 'Test Asset',
        summary: 'A summary',
        contentType: ContentType.TUTORIAL,
        tags: ['test-tag'],
        ...overrides,
      },
    });
    expect(response.statusCode).toBe(201);
    return response.json<{ id: string; slug: string; status: string }>();
  }

  async function publishAsset(assetId: string) {
    await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${assetId}/submit-review`,
      cookies: { sessionId: adminCookie },
    });
    await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${assetId}/approve`,
      cookies: { sessionId: adminCookie },
    });
    const publish = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${assetId}/publish`,
      cookies: { sessionId: adminCookie },
    });
    expect(publish.statusCode).toBe(200);
    return publish.json<{ slug: string; status: string; publishedAt: string | null }>();
  }

  it('happy path: create → read → update → delete asset', async () => {
    const created = await createAssetAsAdmin();
    expect(created.status).toBe('DRAFT');

    const get = await server.inject({
      method: 'GET',
      url: `/api/v1/admin/assets/${created.id}`,
      cookies: { sessionId: adminCookie },
    });
    expect(get.statusCode).toBe(200);
    expect(get.json<{ title: string }>().title).toBe('Test Asset');

    const update = await server.inject({
      method: 'PUT',
      url: `/api/v1/admin/assets/${created.id}`,
      cookies: { sessionId: adminCookie },
      payload: { title: 'Updated Asset', rawContent: '# v1' },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json<{ title: string }>().title).toBe('Updated Asset');

    const del = await server.inject({
      method: 'DELETE',
      url: `/api/v1/admin/assets/${created.id}`,
      cookies: { sessionId: adminCookie },
    });
    expect(del.statusCode).toBe(200);
    expect(del.json<{ status: string }>().status).toBe('DELETED');
  });

  it('state machine: invalid transition returns 409', async () => {
    const created = await createAssetAsAdmin();

    const publish = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${created.id}/publish`,
      cookies: { sessionId: adminCookie },
    });
    expect(publish.statusCode).toBe(409);
    expect(publish.json<{ error: string }>().error).toBe('conflict');
  });

  it('RBAC: contributor cannot create assets', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/assets',
      cookies: { sessionId: contributorCookie },
      payload: {
        title: 'Forbidden',
        contentType: ContentType.TUTORIAL,
      },
    });
    expect(response.statusCode).toBe(403);
  });

  it('validation: missing required field returns 400', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/assets',
      cookies: { sessionId: adminCookie },
      payload: { summary: 'no title' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('soft delete: deleted asset not in public listing', async () => {
    const created = await createAssetAsAdmin({ title: 'Public Asset' });
    const published = await publishAsset(created.id);

    const publicBefore = await server.inject({
      method: 'GET',
      url: '/api/v1/assets',
    });
    expect(
      publicBefore
        .json<{ items: Array<{ slug: string }> }>()
        .items.some((a) => a.slug === published.slug),
    ).toBe(true);

    await server.inject({
      method: 'DELETE',
      url: `/api/v1/admin/assets/${created.id}`,
      cookies: { sessionId: adminCookie },
    });

    const publicAfter = await server.inject({
      method: 'GET',
      url: '/api/v1/assets',
    });
    expect(
      publicAfter
        .json<{ items: Array<{ slug: string }> }>()
        .items.some((a) => a.slug === published.slug),
    ).toBe(false);
  });

  it('category path: nested category has correct materialized path', async () => {
    const parent = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/categories',
      cookies: { sessionId: adminCookie },
      payload: { slug: 'test-cat-parent', name: 'Parent' },
    });
    expect(parent.statusCode).toBe(201);
    const parentBody = parent.json<{ id: string; path: string }>();

    const child = await server.inject({
      method: 'POST',
      url: '/api/v1/admin/categories',
      cookies: { sessionId: adminCookie },
      payload: {
        slug: 'test-cat-child',
        name: 'Child',
        parentId: parentBody.id,
      },
    });
    expect(child.statusCode).toBe(201);
    expect(child.json<{ path: string }>().path).toBe('test-cat-parent/test-cat-child');
  });

  it('attachment: oversized file returns 413', async () => {
    const created = await createAssetAsAdmin();
    const boundary = '----FormBoundary';
    const oversized = 'x'.repeat(11 * 1024 * 1024);
    const payload =
      `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="file"; filename="big.pdf"\r\n' +
      'Content-Type: application/pdf\r\n\r\n' +
      `${oversized}\r\n` +
      `--${boundary}--\r\n`;

    const response = await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${created.id}/attachments`,
      cookies: { sessionId: adminCookie },
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload,
    });

    expect(response.statusCode).toBe(413);
  });

  it('audit log: lifecycle transitions create audit entries', async () => {
    const created = await createAssetAsAdmin();

    await server.inject({
      method: 'POST',
      url: `/api/v1/admin/assets/${created.id}/submit-review`,
      cookies: { sessionId: adminCookie },
    });

    const audit = await server.inject({
      method: 'GET',
      url: '/api/v1/admin/audit',
      cookies: { sessionId: adminCookie },
    });
    expect(audit.statusCode).toBe(200);

    const items = audit.json<{ items: Array<{ action: string; resourceId: string }> }>().items;
    expect(items.some((e) => e.action === 'submit_review' && e.resourceId === created.id)).toBe(
      true,
    );
    expect(adminId).toBeDefined();
  });
});
