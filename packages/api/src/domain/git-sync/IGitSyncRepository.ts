import { SyncStatus } from '@knowledge-base-central/shared';

export interface GitSyncJob {
  id: string;
  repository: string;
  trigger: string;
  status: SyncStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  syncedCount: number | null;
}

export interface CreateGitSyncJobInput {
  repository: string;
  trigger: string;
}

export interface UpdateGitSyncJobInput {
  status?: SyncStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  errorMessage?: string | null;
  syncedCount?: number | null;
}

export interface IGitSyncRepository {
  createJob(input: CreateGitSyncJobInput): Promise<GitSyncJob>;
  updateJob(id: string, input: UpdateGitSyncJobInput): Promise<GitSyncJob>;
  findLatest(repository: string): Promise<GitSyncJob | null>;
}
