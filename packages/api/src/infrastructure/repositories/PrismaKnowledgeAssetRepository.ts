import type { PrismaClient } from '@prisma/client';
import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';

import type { AssetFilter } from '../../domain/common/types.js';
import type { KnowledgeAsset } from '../../domain/knowledge-asset/KnowledgeAsset.js';
import type { IKnowledgeAssetRepository } from '../../domain/knowledge-asset/IKnowledgeAssetRepository.js';

import { toDomainKnowledgeAsset, toPrismaKnowledgeAsset } from '../mappers/knowledgeAssetMapper.js';

const STATUS_TO_PRISMA = {
  [KnowledgeAssetStatus.DRAFT]: 'DRAFT',
  [KnowledgeAssetStatus.REVIEW]: 'REVIEW',
  [KnowledgeAssetStatus.APPROVED]: 'APPROVED',
  [KnowledgeAssetStatus.PUBLISHED]: 'PUBLISHED',
  [KnowledgeAssetStatus.ARCHIVED]: 'ARCHIVED',
  [KnowledgeAssetStatus.DELETED]: 'DELETED',
} as const;

export class PrismaKnowledgeAssetRepository implements IKnowledgeAssetRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const record = await this.db.knowledgeAsset.findUnique({ where: { id } });
    return record ? toDomainKnowledgeAsset(record) : null;
  }

  async findBySlug(slug: string) {
    const record = await this.db.knowledgeAsset.findUnique({ where: { slug } });
    return record ? toDomainKnowledgeAsset(record) : null;
  }

  async findAll(filter: AssetFilter) {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    let categoryId = filter.categoryId;
    if (filter.categorySlug && !categoryId) {
      const category = await this.db.category.findUnique({
        where: { slug: filter.categorySlug },
        select: { id: true },
      });
      if (!category) {
        return { items: [], total: 0, page, pageSize };
      }
      categoryId = category.id;
    }

    const where = {
      ...(filter.status ? { status: STATUS_TO_PRISMA[filter.status] } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(filter.authorId ? { authorId: filter.authorId } : {}),
      ...(filter.tagSlug
        ? {
            tags: {
              some: { tag: { slug: filter.tagSlug } },
            },
          }
        : {}),
      ...(!filter.includeDeleted ? { deletedAt: null } : {}),
    };

    const [records, total] = await Promise.all([
      this.db.knowledgeAsset.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.db.knowledgeAsset.count({ where }),
    ]);

    return {
      items: records.map(toDomainKnowledgeAsset),
      total,
      page,
      pageSize,
    };
  }

  async save(asset: KnowledgeAsset) {
    const data = toPrismaKnowledgeAsset(asset);
    await this.db.knowledgeAsset.upsert({
      where: { id: asset.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string) {
    await this.db.knowledgeAsset.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }
}
