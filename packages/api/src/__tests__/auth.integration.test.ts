import { randomUUID } from 'node:crypto';

import { UserRole } from '@knowledge-base-central/shared';
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

describe.skipIf(!databaseUrl)('Auth integration', () => {
  let server: FastifyInstance;
  let testEmail: string;
  let testUsername: string;
  let testPassword: string;

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

    testEmail = `auth-${randomUUID()}@example.com`;
    testUsername = `user${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    testPassword = 'secure-password-1';

    await prisma.oAuthAccount.deleteMany({
      where: { user: { email: { contains: '@example.com' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    });
  });

  async function registerUser() {
    const response = await server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: testEmail,
        username: testUsername,
        password: testPassword,
      },
    });

    expect(response.statusCode).toBe(201);
    return response.json<{ id: string; email: string; username: string }>();
  }

  it('register → login → me → logout → me returns 401', async () => {
    const registered = await registerUser();

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json<{ user: { id: string; email: string; role: string } }>();
    expect(loginBody.user.id).toBe(registered.id);
    expect(loginBody.user.email).toBe(testEmail);
    expect(loginBody.user.role).toBe(UserRole.CONTRIBUTOR);

    const sessionCookie = loginResponse.cookies.find((cookie) => cookie.name === 'sessionId');
    expect(sessionCookie).toBeDefined();

    const meResponse = await server.inject({
      method: 'GET',
      url: '/auth/me',
      cookies: {
        sessionId: sessionCookie!.value,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    const meBody = meResponse.json<{ id: string; email: string; username: string; role: string }>();
    expect(meBody.id).toBe(registered.id);
    expect(meBody.email).toBe(testEmail);
    expect(meBody.username).toBe(testUsername);

    const logoutResponse = await server.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: {
        sessionId: sessionCookie!.value,
      },
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.json()).toEqual({ ok: true });

    const meAfterLogout = await server.inject({
      method: 'GET',
      url: '/auth/me',
      cookies: {
        sessionId: sessionCookie!.value,
      },
    });

    expect(meAfterLogout.statusCode).toBe(401);
  });

  it('stores bcrypt password hash, not plaintext', async () => {
    await registerUser();

    const record = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(record?.passwordHash).toBeDefined();
    expect(record?.passwordHash).not.toBe(testPassword);
    expect(record?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('returns 401 for wrong password', async () => {
    await registerUser();

    const response = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: testEmail,
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 401 for unknown email', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'missing@example.com',
        password: 'any-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 403 for CONTRIBUTOR on article:publish route', async () => {
    const registered = await registerUser();

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    const sessionCookie = loginResponse.cookies.find((cookie) => cookie.name === 'sessionId');

    const forbiddenResponse = await server.inject({
      method: 'GET',
      url: '/test/article/publish',
      cookies: {
        sessionId: sessionCookie!.value,
      },
    });

    expect(forbiddenResponse.statusCode).toBe(403);
    expect(registered.id).toBeDefined();
  });

  it('returns 200 for ADMIN on article:publish route', async () => {
    const adminEmail = `admin-${randomUUID()}@example.com`;
    const adminUsername = `admin${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    const admin = new User({
      id: randomUUID(),
      email: adminEmail,
      username: adminUsername,
      passwordHash: await hashPassword('admin-password-1'),
      role: UserRole.ADMIN,
      status: 'ACTIVE',
    });

    await createContainer(prisma).userRepository.save(admin);

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: adminEmail,
        password: 'admin-password-1',
      },
    });

    expect(loginResponse.statusCode).toBe(200);

    const sessionCookie = loginResponse.cookies.find((cookie) => cookie.name === 'sessionId');

    const allowedResponse = await server.inject({
      method: 'GET',
      url: '/test/article/publish',
      cookies: {
        sessionId: sessionCookie!.value,
      },
    });

    expect(allowedResponse.statusCode).toBe(200);
    expect(allowedResponse.json()).toEqual({ ok: true });
  });

  it('returns 429 on 11th login attempt within 1 minute', async () => {
    await registerUser();
    const rateLimitIp = `10.99.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await server.inject({
        method: 'POST',
        url: '/auth/login',
        remoteAddress: rateLimitIp,
        payload: {
          email: testEmail,
          password: 'wrong-password',
        },
      });

      expect(response.statusCode).toBe(401);
    }

    const rateLimitedResponse = await server.inject({
      method: 'POST',
      url: '/auth/login',
      remoteAddress: rateLimitIp,
      payload: {
        email: testEmail,
        password: 'wrong-password',
      },
    });

    expect(rateLimitedResponse.statusCode).toBe(429);
  });
});
