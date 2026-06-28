import type { PrismaClient } from '@prisma/client';

import { ContentType, Difficulty, KnowledgeAssetStatus } from '@knowledge-base-central/shared';
import { KnowledgeAsset } from '../../domain/knowledge-asset/KnowledgeAsset.js';
import type { ParsedMarkdown } from './MarkdownParser.js';

export interface AssetMappingContext {
  categorySlug: string;
  categoryId?: string;
  tagIds: string[];
  gitSha: string;
  authorId?: string;
}

export interface AssetMappingResult {
  asset: KnowledgeAsset;
  isNew: boolean;
  warnings: string[];
}

export class AssetMapper {
  constructor(private readonly db: PrismaClient) {}

  async mapToAsset(
    parsedMarkdown: ParsedMarkdown,
    filePath: string,
    context: AssetMappingContext,
  ): Promise<AssetMappingResult> {
    const { frontmatter, body } = parsedMarkdown;
    const warnings: string[] = [];

    const slug = this.normalizeSlug(
      (frontmatter.slug as string) || this.deriveSlugFromPath(filePath),
    );

    const existing = await this.db.knowledgeAsset.findUnique({
      where: { slug },
    });

    const assetData: Parameters<typeof KnowledgeAsset.create>[0] = {
      slug,
      title: (frontmatter.title as string) || slug,
      summary: frontmatter.summary as string | undefined,
      content: body,
      rawContent: body,
      contentType: this.parseContentType(frontmatter.contentType as string),
      difficulty: this.parseDifficulty(frontmatter.difficulty as string),
      authorId: context.authorId,
      categoryId: context.categoryId,
      metadata: {
        tags: frontmatter.tags,
        gitPath: filePath,
        syncWarnings: [],
      },
    };

    let asset: KnowledgeAsset;

    if (existing) {
      const statusFromFrontmatter = frontmatter.status as string;
      const derivedStatus = this.parseStatus(statusFromFrontmatter);

      asset = KnowledgeAsset.reconstitute({
        id: existing.id,
        slug: existing.slug,
        title: assetData.title,
        summary: assetData.summary,
        content: assetData.content,
        rawContent: assetData.rawContent,
        status: derivedStatus,
        contentType: assetData.contentType,
        difficulty: assetData.difficulty,
        authorId: assetData.authorId,
        categoryId: assetData.categoryId,
        gitSha: context.gitSha,
        version: existing.version,
        metadata: assetData.metadata,
        publishedAt: existing.publishedAt,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        deletedAt: existing.deletedAt,
      });

      if (!assetData.title || !assetData.slug) {
        warnings.push('Missing required frontmatter fields, asset created as DRAFT');
      }
    } else {
      if (!assetData.title || !assetData.slug) {
        warnings.push('Missing required frontmatter fields, asset created as DRAFT');
      }

      asset = KnowledgeAsset.create(assetData);
      asset = KnowledgeAsset.reconstitute({
        ...asset.toProps(),
        gitSha: context.gitSha,
      });
    }

    return {
      asset,
      isNew: !existing || existing.deletedAt !== null,
      warnings,
    };
  }

  deriveCategorySlugFromPath(filePath: string): string {
    const parts = filePath.split('/');

    if (parts.length >= 2) {
      const possibleCategory = parts[parts.length - 2];
      if (possibleCategory !== 'articles' && possibleCategory !== 'content') {
        return possibleCategory;
      }
      return parts[parts.length - 3] || 'uncategorized';
    }

    return 'uncategorized';
  }

  deriveSlugFromPath(filePath: string): string {
    const filename = filePath.split('/').pop() || filePath;
    return filename.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '-');
  }

  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private parseContentType(value?: string): ContentType | null {
    if (!value) return null;
    const normalized = value.toUpperCase().replace('-', '_') as Uppercase<typeof value>;
    const types: ContentType[] = [
      'CONCEPT',
      'TUTORIAL',
      'RESEARCH_NOTE',
      'REFERENCE_MATERIAL',
      'LEARNING_NOTE',
      'ARCHITECTURE_NOTE',
    ];
    return types.includes(normalized as ContentType) ? (normalized as ContentType) : null;
  }

  private parseDifficulty(value?: string): Difficulty | null {
    if (!value) return null;
    const normalized = value.toUpperCase() as Uppercase<typeof value>;
    const difficulties: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    return difficulties.includes(normalized as Difficulty) ? (normalized as Difficulty) : null;
  }

  private parseStatus(value?: string): KnowledgeAssetStatus {
    if (!value) return KnowledgeAssetStatus.DRAFT;
    const normalized = value.toUpperCase().replace('-', '_') as Uppercase<typeof value>;
    const statuses: KnowledgeAssetStatus[] = [
      'DRAFT',
      'REVIEW',
      'APPROVED',
      'PUBLISHED',
      'ARCHIVED',
      'DELETED',
    ];
    return statuses.includes(normalized as KnowledgeAssetStatus)
      ? (normalized as KnowledgeAssetStatus)
      : KnowledgeAssetStatus.DRAFT;
  }
}
