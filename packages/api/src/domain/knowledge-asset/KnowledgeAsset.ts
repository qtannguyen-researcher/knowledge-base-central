import { ContentType, Difficulty, KnowledgeAssetStatus } from '@knowledge-base-central/shared';

import { DomainError } from '../errors/DomainError.js';

export interface KnowledgeAssetProps {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  rawContent?: string | null;
  status: KnowledgeAssetStatus;
  contentType?: ContentType | null;
  difficulty?: Difficulty | null;
  authorId?: string | null;
  categoryId?: string | null;
  gitSha?: string | null;
  version?: string | null;
  metadata?: Record<string, unknown> | null;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateKnowledgeAssetProps {
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  rawContent?: string | null;
  contentType?: ContentType | null;
  difficulty?: Difficulty | null;
  authorId?: string | null;
  categoryId?: string | null;
  metadata?: Record<string, unknown> | null;
}

const VALID_TRANSITIONS: Record<KnowledgeAssetStatus, KnowledgeAssetStatus[]> = {
  DRAFT: ['REVIEW', 'DELETED'],
  REVIEW: ['APPROVED', 'DELETED'],
  APPROVED: ['PUBLISHED', 'DELETED'],
  PUBLISHED: ['ARCHIVED', 'DELETED'],
  ARCHIVED: ['DRAFT', 'DELETED'],
  DELETED: [],
};

export class KnowledgeAsset {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string | null;
  readonly content: string | null;
  readonly rawContent: string | null;
  readonly status: KnowledgeAssetStatus;
  readonly contentType: ContentType | null;
  readonly difficulty: Difficulty | null;
  readonly authorId: string | null;
  readonly categoryId: string | null;
  readonly gitSha: string | null;
  readonly version: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: KnowledgeAssetProps) {
    this.id = props.id;
    this.slug = props.slug;
    this.title = props.title;
    this.summary = props.summary ?? null;
    this.content = props.content ?? null;
    this.rawContent = props.rawContent ?? null;
    this.status = props.status;
    this.contentType = props.contentType ?? null;
    this.difficulty = props.difficulty ?? null;
    this.authorId = props.authorId ?? null;
    this.categoryId = props.categoryId ?? null;
    this.gitSha = props.gitSha ?? null;
    this.version = props.version ?? null;
    this.metadata = props.metadata ?? null;
    this.publishedAt = props.publishedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
  }

  static create(props: CreateKnowledgeAssetProps): KnowledgeAsset {
    if (!props.slug?.trim()) {
      throw new DomainError('Knowledge asset slug is required');
    }
    if (!props.title?.trim()) {
      throw new DomainError('Knowledge asset title is required');
    }

    return new KnowledgeAsset({
      id: crypto.randomUUID(),
      slug: props.slug.trim(),
      title: props.title.trim(),
      summary: props.summary ?? null,
      content: props.content ?? null,
      rawContent: props.rawContent ?? null,
      status: KnowledgeAssetStatus.DRAFT,
      contentType: props.contentType ?? null,
      difficulty: props.difficulty ?? null,
      authorId: props.authorId ?? null,
      categoryId: props.categoryId ?? null,
      metadata: props.metadata ?? null,
    });
  }

  static reconstitute(props: KnowledgeAssetProps): KnowledgeAsset {
    return new KnowledgeAsset(props);
  }

  canTransitionTo(newStatus: KnowledgeAssetStatus): boolean {
    if (newStatus === KnowledgeAssetStatus.DELETED) {
      return this.status !== KnowledgeAssetStatus.DELETED;
    }

    return VALID_TRANSITIONS[this.status].includes(newStatus);
  }

  submitForReview(): KnowledgeAsset {
    return this.transitionTo(KnowledgeAssetStatus.REVIEW);
  }

  approve(): KnowledgeAsset {
    return this.transitionTo(KnowledgeAssetStatus.APPROVED);
  }

  publish(): KnowledgeAsset {
    const next = this.transitionTo(KnowledgeAssetStatus.PUBLISHED);
    return KnowledgeAsset.reconstitute({
      ...next.toProps(),
      publishedAt: next.publishedAt ?? new Date(),
    });
  }

  archive(): KnowledgeAsset {
    return this.transitionTo(KnowledgeAssetStatus.ARCHIVED);
  }

  restore(): KnowledgeAsset {
    return this.transitionTo(KnowledgeAssetStatus.DRAFT);
  }

  update(
    props: Partial<
      Pick<
        KnowledgeAssetProps,
        | 'title'
        | 'summary'
        | 'content'
        | 'rawContent'
        | 'contentType'
        | 'difficulty'
        | 'categoryId'
        | 'metadata'
        | 'gitSha'
      >
    >,
  ): KnowledgeAsset {
    return KnowledgeAsset.reconstitute({
      ...this.toProps(),
      ...props,
      updatedAt: new Date(),
    });
  }

  softDelete(): KnowledgeAsset {
    const next = this.transitionTo(KnowledgeAssetStatus.DELETED);
    return KnowledgeAsset.reconstitute({
      ...next.toProps(),
      deletedAt: new Date(),
    });
  }

  toProps(): KnowledgeAssetProps {
    return {
      id: this.id,
      slug: this.slug,
      title: this.title,
      summary: this.summary,
      content: this.content,
      rawContent: this.rawContent,
      status: this.status,
      contentType: this.contentType,
      difficulty: this.difficulty,
      authorId: this.authorId,
      categoryId: this.categoryId,
      gitSha: this.gitSha,
      version: this.version,
      metadata: this.metadata,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }

  private transitionTo(newStatus: KnowledgeAssetStatus): KnowledgeAsset {
    if (!this.canTransitionTo(newStatus)) {
      throw new DomainError(`Invalid status transition from ${this.status} to ${newStatus}`);
    }

    return KnowledgeAsset.reconstitute({
      ...this.toProps(),
      status: newStatus,
      updatedAt: new Date(),
    });
  }
}
