import type {
  ContentType as PrismaContentType,
  Difficulty as PrismaDifficulty,
  KnowledgeAsset as PrismaKnowledgeAsset,
  KnowledgeAssetStatus as PrismaKnowledgeAssetStatus,
  Prisma,
} from '@prisma/client';
import { ContentType, Difficulty, KnowledgeAssetStatus } from '@knowledge-base-central/shared';

import {
  KnowledgeAsset,
  type KnowledgeAssetProps,
} from '../../domain/knowledge-asset/KnowledgeAsset.js';

const STATUS_MAP: Record<PrismaKnowledgeAssetStatus, KnowledgeAssetStatus> = {
  DRAFT: KnowledgeAssetStatus.DRAFT,
  REVIEW: KnowledgeAssetStatus.REVIEW,
  APPROVED: KnowledgeAssetStatus.APPROVED,
  PUBLISHED: KnowledgeAssetStatus.PUBLISHED,
  ARCHIVED: KnowledgeAssetStatus.ARCHIVED,
  DELETED: KnowledgeAssetStatus.DELETED,
};

const STATUS_TO_PRISMA: Record<KnowledgeAssetStatus, PrismaKnowledgeAssetStatus> = {
  [KnowledgeAssetStatus.DRAFT]: 'DRAFT',
  [KnowledgeAssetStatus.REVIEW]: 'REVIEW',
  [KnowledgeAssetStatus.APPROVED]: 'APPROVED',
  [KnowledgeAssetStatus.PUBLISHED]: 'PUBLISHED',
  [KnowledgeAssetStatus.ARCHIVED]: 'ARCHIVED',
  [KnowledgeAssetStatus.DELETED]: 'DELETED',
};

const CONTENT_TYPE_MAP: Record<PrismaContentType, ContentType> = {
  CONCEPT: ContentType.CONCEPT,
  TUTORIAL: ContentType.TUTORIAL,
  RESEARCH_NOTE: ContentType.RESEARCH_NOTE,
  REFERENCE_MATERIAL: ContentType.REFERENCE_MATERIAL,
  LEARNING_NOTE: ContentType.LEARNING_NOTE,
  ARCHITECTURE_NOTE: ContentType.ARCHITECTURE_NOTE,
};

const CONTENT_TYPE_TO_PRISMA: Record<ContentType, PrismaContentType> = {
  [ContentType.CONCEPT]: 'CONCEPT',
  [ContentType.TUTORIAL]: 'TUTORIAL',
  [ContentType.RESEARCH_NOTE]: 'RESEARCH_NOTE',
  [ContentType.REFERENCE_MATERIAL]: 'REFERENCE_MATERIAL',
  [ContentType.LEARNING_NOTE]: 'LEARNING_NOTE',
  [ContentType.ARCHITECTURE_NOTE]: 'ARCHITECTURE_NOTE',
};

const DIFFICULTY_MAP: Record<PrismaDifficulty, Difficulty> = {
  BEGINNER: Difficulty.BEGINNER,
  INTERMEDIATE: Difficulty.INTERMEDIATE,
  ADVANCED: Difficulty.ADVANCED,
};

const DIFFICULTY_TO_PRISMA: Record<Difficulty, PrismaDifficulty> = {
  [Difficulty.BEGINNER]: 'BEGINNER',
  [Difficulty.INTERMEDIATE]: 'INTERMEDIATE',
  [Difficulty.ADVANCED]: 'ADVANCED',
};

export function toDomainKnowledgeAsset(record: PrismaKnowledgeAsset): KnowledgeAsset {
  const props: KnowledgeAssetProps = {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    content: record.content,
    rawContent: record.rawContent,
    status: STATUS_MAP[record.status],
    contentType: record.contentType ? CONTENT_TYPE_MAP[record.contentType] : null,
    difficulty: record.difficulty ? DIFFICULTY_MAP[record.difficulty] : null,
    authorId: record.authorId,
    categoryId: record.categoryId,
    gitSha: record.gitSha,
    version: record.version,
    metadata: record.metadata as Record<string, unknown> | null,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  };

  return KnowledgeAsset.reconstitute(props);
}

export function toPrismaKnowledgeAsset(
  asset: KnowledgeAsset,
): Prisma.KnowledgeAssetUncheckedCreateInput {
  const props = asset.toProps();

  return {
    id: props.id,
    slug: props.slug,
    title: props.title,
    summary: props.summary ?? null,
    content: props.content ?? null,
    rawContent: props.rawContent ?? null,
    status: STATUS_TO_PRISMA[props.status],
    contentType: props.contentType ? CONTENT_TYPE_TO_PRISMA[props.contentType] : null,
    difficulty: props.difficulty ? DIFFICULTY_TO_PRISMA[props.difficulty] : null,
    authorId: props.authorId ?? null,
    categoryId: props.categoryId ?? null,
    gitSha: props.gitSha ?? null,
    version: props.version ?? null,
    ...(props.metadata !== null ? { metadata: props.metadata as Prisma.InputJsonValue } : {}),
    publishedAt: props.publishedAt ?? null,
    createdAt: props.createdAt ?? new Date(),
    updatedAt: props.updatedAt ?? new Date(),
    deletedAt: props.deletedAt ?? null,
  };
}
