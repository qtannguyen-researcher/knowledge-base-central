import { buildServer } from './server.js';
import { config } from './config.js';
import { logger } from './config/logger.js';
import { closeQueue } from './infrastructure/queue/QueueClient.js';
import { closeRedisClient } from './infrastructure/redis/client.js';

let server: Awaited<ReturnType<typeof buildServer>> | null = null;

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received');

  const SHUTDOWN_TIMEOUT_MS = 30000;

  try {
    logger.info({}, 'Step 1: Stopping HTTP server');
    if (server) {
      await server.close();
      logger.info({}, 'HTTP server stopped');
    }

    logger.info({}, 'Step 2: Closing queue connections');
    await closeQueue();
    logger.info({}, 'Queue connections closed');

    logger.info({}, 'Step 3: Closing database connection');
    const { getContainer } = await import('./container.js');
    const container = getContainer();
    await container.prisma.$disconnect();
    logger.info({}, 'Database connection closed');

    logger.info({}, 'Step 4: Closing Redis connection');
    await closeRedisClient();
    logger.info({}, 'Redis connection closed');

    logger.info({}, 'Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ error, signal }, 'Error during graceful shutdown');
    process.exit(1);
  }

  setTimeout(() => {
    logger.error({}, 'Shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  gracefulShutdown('uncaughtException').catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  gracefulShutdown('unhandledRejection').catch(() => process.exit(1));
});

const start = async (): Promise<void> => {
  server = await buildServer();

  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info({ port: config.PORT }, 'Server listening');
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start().catch((err) => {
  logger.fatal({ err }, 'Unhandled error in start()');
  process.exit(1);
});
