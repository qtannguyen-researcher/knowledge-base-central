import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssetFilter {
  status?: KnowledgeAssetStatus;
  categoryId?: string;
  categorySlug?: string;
  tagSlug?: string;
  authorId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
}
