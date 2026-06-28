import type { Job } from 'bullmq';
import { SyncRepositoryUseCase } from '../../application/git-sync/SyncRepositoryUseCase.js';
import type { GitSyncJobData, GitSyncJobResult } from '../queue/QueueClient.js';
import type { Container } from '../../container.js';
import { logger } from '../../config/logger.js';
import { recordGitSync } from '../metrics/MetricsCollector.js';

export function createGitSyncWorkerHandler(container: Container) {
  const syncUseCase = new SyncRepositoryUseCase(
    container.prisma,
    container.gitAdapter,
    container.gitSyncRepository,
    container.knowledgeAssetRepository,
    container.auditService,
  );

  return async (job: Job<GitSyncJobData, GitSyncJobResult>): Promise<GitSyncJobResult> => {
    logger.info(
      {
        jobId: job.id,
        trigger: job.data.trigger,
        repository: job.data.repository,
      },
      'Git sync job started',
    );

    const previousCommitSha = 'unknown';
    let currentCommitSha = 'unknown';

    try {
      const result = await syncUseCase.execute({
        repository: job.data.repository,
        trigger: job.data.trigger,
      });

      currentCommitSha = result.commitSha || 'unknown';

      logger.info(
        {
          jobId: job.id,
          trigger: job.data.trigger,
          previousCommitSha,
          currentCommitSha,
          fileCount: result.syncedCount,
          success: result.success,
        },
        'Git sync job completed',
      );

      recordGitSync('completed');

      return {
        success: result.success,
        syncedCount: result.syncedCount,
        errorMessage: result.errorMessage,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        {
          jobId: job.id,
          trigger: job.data.trigger,
          previousCommitSha,
          currentCommitSha,
          error: errorMessage,
        },
        'Git sync job failed',
      );

      recordGitSync('failed');

      return {
        success: false,
        errorMessage,
      };
    }
  };
}

export async function registerGitSyncWorker(container: Container): Promise<void> {
  const { createGitSyncWorker } = await import('../queue/QueueClient.js');
  const handler = createGitSyncWorkerHandler(container);

  createGitSyncWorker(handler);

  logger.info({ worker: 'git-sync' }, 'Worker registered and ready');
}
