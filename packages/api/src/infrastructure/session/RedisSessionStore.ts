import type { SessionStore } from '@fastify/session';
import type { Redis } from 'ioredis';

const SESSION_PREFIX = 'kbc:sess:';
const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

function sessionKey(sessionId: string): string {
  return `${SESSION_PREFIX}${sessionId}`;
}

function ttlSeconds(session: { cookie: { maxAge?: number | null } }): number {
  if (session.cookie.maxAge && session.cookie.maxAge > 0) {
    return Math.ceil(session.cookie.maxAge / 1000);
  }
  return DEFAULT_TTL_SECONDS;
}

export function createRedisSessionStore(client: Redis): SessionStore {
  return {
    set(sessionId, session, callback) {
      client
        .set(sessionKey(sessionId), JSON.stringify(session), 'EX', ttlSeconds(session))
        .then(() => callback())
        .catch((error) => callback(error));
    },
    get(sessionId, callback) {
      client
        .get(sessionKey(sessionId))
        .then((data) => {
          if (!data) {
            callback(null, null);
            return;
          }
          callback(null, JSON.parse(data));
        })
        .catch((error) => callback(error));
    },
    destroy(sessionId, callback) {
      client
        .del(sessionKey(sessionId))
        .then(() => callback())
        .catch((error) => callback(error));
    },
  };
}
