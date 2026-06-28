import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../../config/logger.js';
import { recordQueueJob } from '../metrics/MetricsCollector.js';

export interface GitSyncJobData {
  jobId: string;
  trigger: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';
  repository: string;
}

export interface GitSyncJobResult {
  success: boolean;
  syncedCount?: number;
  errorMessage?: string;
}

let queueInstance: Queue<GitSyncJobData> | null = null;
let workerInstance: Worker<GitSyncJobData, GitSyncJobResult> | null = null;

function getRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

export function getGitSyncQueue(): Queue<GitSyncJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<GitSyncJobData>('git-sync', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 60 * 60,
        },
        removeOnFail: {
          count: 500,
          age: 7 * 24 * 60 * 60,
        },
      },
    });

    queueInstance.on('error', (error) => {
      logger.error({ error, queue: 'git-sync' }, 'Queue error');
    });

    logger.info({ queue: 'git-sync' }, 'Git sync queue initialized');
  }
  return queueInstance;
}

export function getGitSyncWorker(): Worker<GitSyncJobData, GitSyncJobResult> | null {
  return workerInstance;
}

export function createGitSyncWorker(
  processor: (job: Job<GitSyncJobData>) => Promise<GitSyncJobResult>,
): Worker<GitSyncJobData, GitSyncJobResult> {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker<GitSyncJobData, GitSyncJobResult>('git-sync', processor, {
    connection: getRedisConnection(),
    concurrency: 1,
  });

  workerInstance.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: 'git-sync' }, 'Job completed');
    recordQueueJob('git-sync', 'completed');
  });

  workerInstance.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: 'git-sync', error: err.message }, 'Job failed');
    recordQueueJob('git-sync', 'failed');
  });

  workerInstance.on('active', (job) => {
    logger.info({ jobId: job.id, queue: 'git-sync' }, 'Job started');
    recordQueueJob('git-sync', 'active');
  });

  workerInstance.on('progress', (job, progress) => {
    logger.debug({ jobId: job.id, queue: 'git-sync', progress }, 'Job progress');
  });

  workerInstance.on('error', (error) => {
    logger.error({ error, queue: 'git-sync' }, 'Worker error');
  });

  logger.info({ queue: 'git-sync' }, 'Git sync worker initialized');

  return workerInstance;
}

export async function enqueueGitSyncJob(data: GitSyncJobData): Promise<Job<GitSyncJobData>> {
  const queue = getGitSyncQueue();
  const job = await queue.add('sync', data, {
    jobId: data.jobId,
  });

  logger.info(
    {
      jobId: job.id,
      queue: 'git-sync',
      trigger: data.trigger,
      repository: data.repository,
    },
    'Job enqueued',
  );

  return job;
}

export async function closeQueue(): Promise<void> {
  logger.info({ queue: 'git-sync' }, 'Closing queue connections');
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
  logger.info({ queue: 'git-sync' }, 'Queue connections closed');
}
