import { Redis } from 'ioredis';

import { config } from '../../config.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export function resetRedisClient(): void {
  redisClient = null;
}
