import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncRepositoryUseCase } from '../SyncRepositoryUseCase.js';
import type { IGitAdapter, ChangedFile } from '../../../domain/git-sync/IGitAdapter.js';
import type { IGitSyncRepository } from '../../../domain/git-sync/IGitSyncRepository.js';
import type { IKnowledgeAssetRepository } from '../../../domain/knowledge-asset/IKnowledgeAssetRepository.js';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../../audit/AuditService.js';
import { SyncStatus } from '@knowledge-base-central/shared';
import { KnowledgeAsset, KnowledgeAssetStatus } from '@knowledge-base-central/shared';

const mockGitAdapter: Partial<IGitAdapter> = {
  clone: vi.fn(),
  pull: vi.fn(),
  listChangedFiles: vi.fn(),
  readFile: vi.fn(),
  getCommitSha: vi.fn(),
  getFileHistory: vi.fn(),
};

const mockGitSyncRepository: Partial<IGitSyncRepository> = {
  createJob: vi.fn(),
  updateJob: vi.fn(),
  findLatest: vi.fn(),
};

const mockKnowledgeAssetRepository: Partial<IKnowledgeAssetRepository> = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findAll: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

const mockDb = {
  $transaction: vi.fn(),
  category: { findUnique: vi.fn() },
  tag: { upsert: vi.fn() },
  knowledgeAsset: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  knowledgeAssetTag: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
} as unknown as Partial<PrismaClient>;

const mockAuditService = {
  log: vi.fn(),
};

describe('GitSync Idempotency Tests', () => {
  let syncUseCase: SyncRepositoryUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    syncUseCase = new SyncRepositoryUseCase(
      mockDb as PrismaClient,
      mockGitAdapter as IGitAdapter,
      mockGitSyncRepository as IGitSyncRepository,
      mockKnowledgeAssetRepository as IKnowledgeAssetRepository,
      mockAuditService as unknown as AuditService,
    );
  });

  describe('Idempotency: Running sync twice on same repo state', () => {
    it('should not create duplicate records on second sync', async () => {
      const jobId = 'test-job-1';
      vi.mocked(mockGitSyncRepository.createJob).mockResolvedValue({
        id: jobId,
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.IDLE,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        syncedCount: null,
      });

      vi.mocked(mockGitSyncRepository.findLatest).mockResolvedValue(null);

      const changedFiles: ChangedFile[] = [{ path: 'articles/test/article.md', status: 'added' }];

      vi.mocked(mockGitAdapter.pull).mockResolvedValue(undefined);
      vi.mocked(mockGitAdapter.getCommitSha).mockResolvedValue('abc1234');
      vi.mocked(mockGitAdapter.listChangedFiles).mockResolvedValue(changedFiles);
      vi.mocked(mockGitAdapter.readFile).mockResolvedValue(`---
title: Test Article
slug: test-article
author: Test Author
---

# Content
`);

      vi.mocked(mockDb.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        slug: 'test',
        name: 'Test',
        path: '/test',
        depth: 0,
        parentId: null,
        description: null,
        createdAt: new Date(),
      });
      vi.mocked(mockDb.tag.upsert).mockResolvedValue({
        id: 'tag-1',
        slug: 'test',
        name: 'Test',
        createdAt: new Date(),
      });

      vi.mocked(mockDb.$transaction).mockImplementation(async (callback) => {
        return callback(mockDb as PrismaClient);
      });

      const result1 = await syncUseCase.execute({
        repository: 'test-repo',
        trigger: 'MANUAL',
      });

      expect(result1.success).toBe(true);
      expect(result1.syncedCount).toBe(1);

      vi.mocked(mockGitAdapter.listChangedFiles).mockResolvedValue([]);
      const result2 = await syncUseCase.execute({
        repository: 'test-repo',
        trigger: 'MANUAL',
      });

      expect(result2.success).toBe(true);
      expect(result2.syncedCount).toBe(0);
    });
  });

  describe('Idempotency: Sync after adding a file', () => {
    it('should create new asset when file is added', async () => {
      vi.mocked(mockGitSyncRepository.createJob).mockResolvedValue({
        id: 'new-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.IDLE,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        syncedCount: null,
      });

      vi.mocked(mockGitSyncRepository.findLatest).mockResolvedValue({
        id: 'prev-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        errorMessage: 'last-sha:abc1230',
        syncedCount: 1,
      });

      const changedFiles: ChangedFile[] = [{ path: 'articles/new/new-file.md', status: 'added' }];

      vi.mocked(mockGitAdapter.pull).mockResolvedValue(undefined);
      vi.mocked(mockGitAdapter.getCommitSha).mockResolvedValue('abc1234');
      vi.mocked(mockGitAdapter.listChangedFiles).mockResolvedValue(changedFiles);
      vi.mocked(mockGitAdapter.readFile).mockResolvedValue(`---
title: New File
slug: new-file
---

# New Content
`);

      vi.mocked(mockDb.category.findUnique).mockResolvedValue(null);
      vi.mocked(mockDb.tag.upsert).mockResolvedValue({
        id: 'tag-1',
        slug: 'test',
        name: 'Test',
        createdAt: new Date(),
      });
      vi.mocked(mockDb.$transaction).mockImplementation(async (callback) => {
        return callback(mockDb as PrismaClient);
      });

      const result = await syncUseCase.execute({
        repository: 'test-repo',
        trigger: 'MANUAL',
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
    });
  });

  describe('Idempotency: Sync after modifying a file', () => {
    it('should update existing asset and change updatedAt and gitSha', async () => {
      const existingAsset = KnowledgeAsset.create({
        slug: 'test-article',
        title: 'Original Title',
        content: 'Original content',
        authorId: 'author-1',
      });

      vi.mocked(mockGitSyncRepository.createJob).mockResolvedValue({
        id: 'update-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.IDLE,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        syncedCount: null,
      });

      vi.mocked(mockGitSyncRepository.findLatest).mockResolvedValue({
        id: 'prev-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        errorMessage: 'last-sha:abc1230',
        syncedCount: 1,
      });

      const changedFiles: ChangedFile[] = [
        { path: 'articles/test/test-article.md', status: 'modified' },
      ];

      vi.mocked(mockGitAdapter.pull).mockResolvedValue(undefined);
      vi.mocked(mockGitAdapter.getCommitSha).mockResolvedValue('new-sha-5678');
      vi.mocked(mockGitAdapter.listChangedFiles).mockResolvedValue(changedFiles);
      vi.mocked(mockGitAdapter.readFile).mockResolvedValue(`---
title: Updated Title
slug: test-article
---

# Updated Content
`);

      vi.mocked(mockDb.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        slug: 'test',
        name: 'Test',
        path: '/test',
        depth: 0,
        parentId: null,
        description: null,
        createdAt: new Date(),
      });
      vi.mocked(mockDb.tag.upsert).mockResolvedValue({
        id: 'tag-1',
        slug: 'test',
        name: 'Test',
        createdAt: new Date(),
      });
      vi.mocked(mockDb.knowledgeAsset.findUnique).mockResolvedValue({
        id: existingAsset.id,
        slug: 'test-article',
        title: 'Original Title',
        summary: null,
        content: 'Original content',
        rawContent: 'Original content',
        status: KnowledgeAssetStatus.PUBLISHED,
        contentType: null,
        difficulty: null,
        authorId: 'author-1',
        categoryId: 'cat-1',
        gitSha: 'abc1230',
        version: '1',
        metadata: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      vi.mocked(mockDb.$transaction).mockImplementation(async (callback) => {
        return callback(mockDb as PrismaClient);
      });

      const result = await syncUseCase.execute({
        repository: 'test-repo',
        trigger: 'MANUAL',
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(mockDb.knowledgeAsset.update).toHaveBeenCalled();
    });
  });

  describe('Idempotency: Sync after deleting a file', () => {
    it('should soft-delete the asset', async () => {
      const existingAsset = KnowledgeAsset.create({
        slug: 'deleted-article',
        title: 'Deleted Article',
        authorId: 'author-1',
      });

      vi.mocked(mockGitSyncRepository.createJob).mockResolvedValue({
        id: 'delete-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.IDLE,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        syncedCount: null,
      });

      vi.mocked(mockGitSyncRepository.findLatest).mockResolvedValue({
        id: 'prev-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        errorMessage: 'last-sha:abc1230',
        syncedCount: 1,
      });

      const changedFiles: ChangedFile[] = [
        { path: 'articles/test/deleted-article.md', status: 'deleted' },
      ];

      vi.mocked(mockGitAdapter.pull).mockResolvedValue(undefined);
      vi.mocked(mockGitAdapter.getCommitSha).mockResolvedValue('abc1234');
      vi.mocked(mockGitAdapter.listChangedFiles).mockResolvedValue(changedFiles);

      vi.mocked(mockKnowledgeAssetRepository.findBySlug).mockResolvedValue(existingAsset);

      const result = await syncUseCase.execute({
        repository: 'test-repo',
        trigger: 'MANUAL',
      });

      expect(result.success).toBe(true);
      expect(mockKnowledgeAssetRepository.save).toHaveBeenCalled();
    });
  });

  describe('Idempotency: Sync with invalid frontmatter', () => {
    it('should save asset as DRAFT with sync warning', async () => {
      vi.mocked(mockGitSyncRepository.createJob).mockResolvedValue({
        id: 'draft-job',
        repository: 'test-repo',
        trigger: 'MANUAL',
        status: SyncStatus.IDLE,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        syncedCount: null,
      });

      vi.mocked(mockGitSyncRepository.findLatest).mockResolvedValue(null);

      const changedFiles: ChangedFile[] = [{ path: 'articles/test/invalid.md', status: 'added' }];

      vi.mocked(mockGitAdapter.pull).mockResolvedValue(undefined);
      vi.mocked(mockGitAdapter.getCommitSha).mockResolvedValue('abc1234');
      vi.mocked(mockGitAdapter.listChangedFiles).mockResolvedValue(changedFiles);

      vi.mocked(mockGitAdapter.readFile).mockResolvedValue(`---
tags:
  - test
---

# Content without required fields
`);

      vi.mocked(mockDb.category.findUnique).mockResolvedValue(null);
      vi.mocked(mockDb.tag.upsert).mockResolvedValue({
        id: 'tag-1',
        slug: 'test',
        name: 'Test',
        createdAt: new Date(),
      });
      vi.mocked(mockDb.$transaction).mockImplementation(async (callback) => {
        return callback(mockDb as PrismaClient);
      });

      const result = await syncUseCase.execute({
        repository: 'test-repo',
        trigger: 'MANUAL',
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
    });
  });
});
