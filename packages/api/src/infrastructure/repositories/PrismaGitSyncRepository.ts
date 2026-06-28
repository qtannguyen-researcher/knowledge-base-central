import type { PrismaClient } from '@prisma/client';
import { SyncStatus } from '@knowledge-base-central/shared';

import type {
  CreateGitSyncJobInput,
  GitSyncJob,
  IGitSyncRepository,
  UpdateGitSyncJobInput,
} from '../../domain/git-sync/IGitSyncRepository.js';

const SYNC_STATUS_MAP: Record<string, SyncStatus> = {
  IDLE: SyncStatus.IDLE,
  SYNCING: SyncStatus.SYNCING,
  COMPLETED: SyncStatus.COMPLETED,
  FAILED: SyncStatus.FAILED,
};

function toDomainJob(record: {
  id: string;
  repository: string;
  trigger: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  syncedCount: number | null;
}): GitSyncJob {
  return {
    id: record.id,
    repository: record.repository,
    trigger: record.trigger,
    status: SYNC_STATUS_MAP[record.status] ?? SyncStatus.IDLE,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    errorMessage: record.errorMessage,
    syncedCount: record.syncedCount,
  };
}

export class PrismaGitSyncRepository implements IGitSyncRepository {
  constructor(private readonly db: PrismaClient) {}

  async createJob(input: CreateGitSyncJobInput): Promise<GitSyncJob> {
    const record = await this.db.gitSyncJob.create({
      data: {
        repository: input.repository,
        trigger: input.trigger as 'MANUAL' | 'SCHEDULED' | 'WEBHOOK',
        status: 'IDLE',
      },
    });
    return toDomainJob(record);
  }

  async updateJob(id: string, input: UpdateGitSyncJobInput): Promise<GitSyncJob> {
    const record = await this.db.gitSyncJob.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
        ...(input.syncedCount !== undefined ? { syncedCount: input.syncedCount } : {}),
      },
    });
    return toDomainJob(record);
  }

  async findLatest(repository: string): Promise<GitSyncJob | null> {
    const record = await this.db.gitSyncJob.findFirst({
      where: { repository },
      orderBy: { startedAt: 'desc' },
    });
    return record ? toDomainJob(record) : null;
  }
}
