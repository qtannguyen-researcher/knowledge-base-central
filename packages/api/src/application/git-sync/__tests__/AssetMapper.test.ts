import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { AssetMapper } from '../AssetMapper.js';
import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';

describe('AssetMapper', () => {
  let assetMapper: AssetMapper;
  let mockDb: Partial<PrismaClient>;

  beforeEach(() => {
    mockDb = {
      knowledgeAsset: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
      },
    };
    assetMapper = new AssetMapper(mockDb as PrismaClient);
  });

  describe('deriveSlugFromPath', () => {
    it('should derive slug from filename', () => {
      const slug = assetMapper.deriveSlugFromPath('articles/my-post.md');
      expect(slug).toBe('my-post');
    });

    it('should handle nested paths', () => {
      const slug = assetMapper.deriveSlugFromPath('content/tutorials/react-hooks.md');
      expect(slug).toBe('react-hooks');
    });

    it('should convert spaces to hyphens', () => {
      const slug = assetMapper.deriveSlugFromPath('docs/My Document.md');
      expect(slug).toBe('my-document');
    });
  });

  describe('deriveCategorySlugFromPath', () => {
    it('should extract category from nested path', () => {
      const categorySlug = assetMapper.deriveCategorySlugFromPath(
        'articles/machine-learning/neural-networks.md',
      );
      expect(categorySlug).toBe('machine-learning');
    });

    it('should return uncategorized for simple paths', () => {
      const categorySlug = assetMapper.deriveCategorySlugFromPath('document.md');
      expect(categorySlug).toBe('uncategorized');
    });
  });

  describe('mapToAsset', () => {
    it('should map valid markdown to new asset', async () => {
      vi.mocked(mockDb.knowledgeAsset!.findUnique).mockResolvedValue(null);

      const parsedMarkdown = {
        frontmatter: {
          title: 'Test Article',
          slug: 'test-article',
          status: 'published',
          author: 'John Doe',
        },
        body: '# Test Content',
      };

      const context = {
        categorySlug: 'test',
        categoryId: 'cat-123',
        tagIds: [],
        gitSha: 'abc1234',
      };

      const result = await assetMapper.mapToAsset(
        parsedMarkdown,
        'articles/test/test-article.md',
        context,
      );

      expect(result.isNew).toBe(true);
      expect(result.asset.title).toBe('Test Article');
      expect(result.asset.slug).toBe('test-article');
      expect(result.warnings).toHaveLength(0);
    });

    it('should update existing asset', async () => {
      const existingAsset = {
        id: 'existing-id',
        slug: 'test-article',
        title: 'Old Title',
        summary: null,
        content: 'Old content',
        rawContent: 'Old content',
        status: KnowledgeAssetStatus.PUBLISHED,
        contentType: null,
        difficulty: null,
        authorId: null,
        categoryId: 'cat-123',
        gitSha: 'old-sha',
        version: '1',
        metadata: null,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(mockDb.knowledgeAsset!.findUnique).mockResolvedValue(existingAsset);

      const parsedMarkdown = {
        frontmatter: {
          title: 'Updated Article',
          slug: 'test-article',
        },
        body: '# Updated Content',
      };

      const context = {
        categorySlug: 'test',
        tagIds: [],
        gitSha: 'new-sha-1234',
      };

      const result = await assetMapper.mapToAsset(
        parsedMarkdown,
        'articles/test/test-article.md',
        context,
      );

      expect(result.isNew).toBe(false);
      expect(result.asset.title).toBe('Updated Article');
      expect(result.asset.gitSha).toBe('new-sha-1234');
    });

    it('should warn on missing required fields', async () => {
      vi.mocked(mockDb.knowledgeAsset!.findUnique).mockResolvedValue(null);

      const parsedMarkdown = {
        frontmatter: {
          tags: ['test'],
        },
        body: '# Content without required fields',
      };

      const context = {
        categorySlug: 'test',
        tagIds: [],
        gitSha: 'abc1234',
      };

      const result = await assetMapper.mapToAsset(
        parsedMarkdown,
        'articles/test/article.md',
        context,
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Missing required frontmatter');
    });
  });
});
