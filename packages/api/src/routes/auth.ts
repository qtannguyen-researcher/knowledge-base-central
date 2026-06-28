import { randomUUID } from 'node:crypto';

import { UserRole } from '@knowledge-base-central/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { AuthError } from '../auth/AuthError.js';
import { requirePermission } from '../auth/middleware.js';
import { hashPassword } from '../auth/password.js';
import { authenticateLocal } from '../auth/strategies/local.js';
import type { Container } from '../container.js';
import { User } from '../domain/user/User.js';
import { getRedisClient } from '../infrastructure/redis/client.js';

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9]+$/, 'Username must be alphanumeric'),
  password: z.string().min(8),
});

function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
}

async function enforceLoginRateLimit(
  ip: string,
  email: string | undefined,
  maxAttempts = 10,
): Promise<boolean> {
  const client = getRedisClient();
  const key = `kbc:login-attempts:${ip}:${email ?? 'unknown'}`;
  const attempts = await client.incr(key);

  if (attempts === 1) {
    await client.expire(key, 60);
  }

  return attempts <= maxAttempts;
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  container: Container,
): Promise<void> {
  app.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const email =
        typeof request.body === 'object' &&
        request.body !== null &&
        'email' in request.body &&
        typeof request.body.email === 'string'
          ? request.body.email
          : undefined;

      const allowed = await enforceLoginRateLimit(request.ip, email);
      if (!allowed) {
        return reply.status(429).send({ error: 'rate_limit_exceeded' });
      }

      try {
        const user = await authenticateLocal(request.body, container.userRepository);
        request.session.userId = user.id;
        return reply.status(200).send({ user: toPublicUser(user) });
      } catch (error) {
        if (error instanceof AuthError) {
          return reply.status(401).send({ error: 'invalid_credentials' });
        }
        throw error;
      }
    },
  );

  app.post(
    '/auth/register',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 hour',
        },
      },
    },
    async (request, reply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_error' });
      }

      const { email, username, password } = parsed.data;

      if (await container.userRepository.findByEmail(email)) {
        return reply.status(409).send({ error: 'email_taken' });
      }

      if (await container.userRepository.findByUsername(username)) {
        return reply.status(409).send({ error: 'username_taken' });
      }

      const user = new User({
        id: randomUUID(),
        email,
        username,
        passwordHash: await hashPassword(password),
        role: UserRole.CONTRIBUTOR,
        status: 'ACTIVE',
      });

      await container.userRepository.save(user);

      return reply.status(201).send({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    },
  );

  app.post('/auth/logout', async (request, reply) => {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    return reply.status(200).send({ ok: true });
  });

  app.get('/auth/me', async (request, reply) => {
    if (!request.session.userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const user = await container.userRepository.findById(request.session.userId);
    if (!user) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    return reply.status(200).send(toPublicUser(user));
  });

  if (process.env['NODE_ENV'] === 'test') {
    app.get(
      '/test/article/publish',
      { preHandler: requirePermission('article:publish', container) },
      async () => ({ ok: true }),
    );
  }
}
