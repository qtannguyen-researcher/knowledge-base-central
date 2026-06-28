import type { PrismaClient } from '@prisma/client';
import type { IGitAdapter, ChangedFile } from '../../domain/git-sync/IGitAdapter.js';
import type { IGitSyncRepository } from '../../domain/git-sync/IGitSyncRepository.js';
import type { IKnowledgeAssetRepository } from '../../domain/knowledge-asset/IKnowledgeAssetRepository.js';
import { MarkdownParser } from './MarkdownParser.js';
import { AssetMapper } from './AssetMapper.js';
import { AuditService } from '../audit/AuditService.js';
import { config } from '../../config.js';
import { SyncStatus } from '@knowledge-base-central/shared';

export interface SyncRepositoryOptions {
  repository: string;
  trigger: 'MANUAL' | 'SCHEDULED' | 'WEBHOOK';
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  jobId: string;
  errorMessage?: string;
}

export class SyncRepositoryUseCase {
  private markdownParser: MarkdownParser;
  private assetMapper: AssetMapper;

  constructor(
    private readonly db: PrismaClient,
    private readonly gitAdapter: IGitAdapter,
    private readonly gitSyncRepository: IGitSyncRepository,
    private readonly knowledgeAssetRepository: IKnowledgeAssetRepository,
    private readonly auditService: AuditService,
  ) {
    this.markdownParser = new MarkdownParser();
    this.assetMapper = new AssetMapper(db);
  }

  async execute(options: SyncRepositoryOptions): Promise<SyncResult> {
    const job = await this.gitSyncRepository.createJob({
      repository: options.repository,
      trigger: options.trigger,
    });

    const localPath = config.GIT_REPO_PATH;

    try {
      await this.gitSyncRepository.updateJob(job.id, {
        status: SyncStatus.SYNCING,
        startedAt: new Date(),
      });

      const lastSync = await this.gitSyncRepository.findLatest(options.repository);
      const sinceSha =
        lastSync && lastSync.status === SyncStatus.COMPLETED
          ? lastSync.errorMessage?.split('last-sha:')[1]?.trim()
          : undefined;

      try {
        await this.gitAdapter.pull(localPath);
      } catch {
        await this.gitAdapter.clone(options.repository, localPath);
      }

      const commitSha = await this.gitAdapter.getCommitSha(localPath);

      const changedFiles = await this.gitAdapter.listChangedFiles(localPath, sinceSha);

      let syncedCount = 0;
      const markdownFiles = changedFiles.filter(
        (f: ChangedFile) => f.path.endsWith('.md') && f.status !== 'deleted',
      );

      for (const file of markdownFiles) {
        await this.processFile(file.path, localPath, commitSha);
        syncedCount++;
      }

      for (const file of changedFiles.filter((f: ChangedFile) => f.status === 'deleted')) {
        await this.processDeletedFile(file.path, commitSha);
      }

      await this.gitSyncRepository.updateJob(job.id, {
        status: SyncStatus.COMPLETED,
        completedAt: new Date(),
        syncedCount,
        errorMessage: `last-sha:${commitSha}`,
      });

      return {
        success: true,
        syncedCount,
        jobId: job.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.gitSyncRepository.updateJob(job.id, {
        status: SyncStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      });

      return {
        success: false,
        syncedCount: 0,
        jobId: job.id,
        errorMessage,
      };
    }
  }

  private async processFile(
    relativePath: string,
    localPath: string,
    commitSha: string,
  ): Promise<void> {
    const fileContent = await this.gitAdapter.readFile(localPath, relativePath);
    const parsed = this.markdownParser.parse(fileContent);
    this.markdownParser.validateFrontmatter(parsed.frontmatter);

    const categorySlug = this.assetMapper.deriveCategorySlugFromPath(relativePath);
    const category = await this.db.category.findUnique({
      where: { slug: categorySlug },
    });

    const tagIds: string[] = [];
    const tagSlugs = parsed.frontmatter.tags as string[] | undefined;
    if (tagSlugs && Array.isArray(tagSlugs)) {
      for (const tagSlug of tagSlugs) {
        const tag = await this.db.tag.upsert({
          where: { slug: tagSlug },
          create: { slug: tagSlug, name: tagSlug },
          update: {},
        });
        tagIds.push(tag.id);
      }
    }

    const context = {
      categorySlug,
      categoryId: category?.id,
      tagIds,
      gitSha: commitSha,
    };

    const result = await this.assetMapper.mapToAsset(parsed, relativePath, context);

    await this.saveAsset(result.asset, tagIds);

    await this.auditService.log(null, 'git_sync', 'knowledge_asset', result.asset.id, {
      action: result.isNew ? 'created' : 'updated',
      path: relativePath,
      commitSha,
      warnings: result.warnings,
    });
  }

  private async processDeletedFile(relativePath: string, commitSha: string): Promise<void> {
    const slug = this.assetMapper.deriveSlugFromPath(relativePath);
    const existing = await this.knowledgeAssetRepository.findBySlug(slug);

    if (existing && existing.status !== 'DELETED') {
      const deletedAsset = existing.softDelete();
      await this.knowledgeAssetRepository.save(deletedAsset);

      await this.auditService.log(null, 'git_sync', 'knowledge_asset', existing.id, {
        action: 'deleted',
        path: relativePath,
        commitSha,
      });
    }
  }

  private async saveAsset(
    asset: import('../../domain/knowledge-asset/KnowledgeAsset.js').KnowledgeAsset,
    tagIds: string[],
  ): Promise<void> {
    const props = asset.toProps();

    await this.db.$transaction(async (tx) => {
      const existing = await tx.knowledgeAsset.findUnique({
        where: { slug: props.slug },
      });

      if (existing) {
        await tx.knowledgeAsset.update({
          where: { id: existing.id },
          data: {
            title: props.title,
            summary: props.summary,
            content: props.content,
            rawContent: props.rawContent,
            status: props.status,
            contentType: props.contentType,
            difficulty: props.difficulty,
            categoryId: props.categoryId,
            gitSha: props.gitSha,
            metadata: props.metadata as object,
          },
        });

        if (tagIds.length > 0) {
          await tx.knowledgeAssetTag.deleteMany({
            where: { assetId: existing.id },
          });
          await tx.knowledgeAssetTag.createMany({
            data: tagIds.map((tagId) => ({
              assetId: existing.id,
              tagId,
            })),
          });
        }
      } else {
        await tx.knowledgeAsset.create({
          data: {
            id: props.id,
            slug: props.slug,
            title: props.title,
            summary: props.summary,
            content: props.content,
            rawContent: props.rawContent,
            status: props.status,
            contentType: props.contentType,
            difficulty: props.difficulty,
            authorId: props.authorId,
            categoryId: props.categoryId,
            gitSha: props.gitSha,
            metadata: props.metadata as object,
            deletedAt: props.deletedAt,
          },
        });

        if (tagIds.length > 0) {
          await tx.knowledgeAssetTag.createMany({
            data: tagIds.map((tagId) => ({
              assetId: props.id,
              tagId,
            })),
          });
        }
      }
    });
  }
}
