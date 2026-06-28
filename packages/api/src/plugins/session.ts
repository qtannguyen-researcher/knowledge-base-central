import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import type { FastifyInstance } from 'fastify';

import { config } from '../config.js';
import { getRedisClient } from '../infrastructure/redis/client.js';
import { createRedisSessionStore } from '../infrastructure/session/RedisSessionStore.js';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function registerSessionPlugin(app: FastifyInstance): Promise<void> {
  const store = createRedisSessionStore(getRedisClient());

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: config.SESSION_SECRET,
    store,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}
