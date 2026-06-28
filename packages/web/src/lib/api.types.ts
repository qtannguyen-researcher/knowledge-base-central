export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface KnowledgeAsset {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  rawContent: string | null;
  status: string;
  contentType: string | null;
  difficulty: string | null;
  authorId: string | null;
  categoryId: string | null;
  gitSha: string | null;
  version: string | null;
  metadata: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  path: string;
  depth: number;
  parentId?: string;
  children: CategoryNode[];
}

export interface CategoryDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  path: string;
  depth: number;
  assets: KnowledgeAsset[];
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  assetCount: number;
  createdAt: string;
}

export interface Concept {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  description: string | null;
  domain: string | null;
  createdAt: string;
  assets?: KnowledgeAsset[];
}

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimatedDuration: number | null;
  status: string;
}

export interface LearningPathDetail extends LearningPath {
  items: Array<{
    position: number;
    asset: KnowledgeAsset;
  }>;
}

export interface SearchResult {
  assetId: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  tags: string[];
  difficulty?: string;
  rank: number;
  publishedAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Relationship {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship: string;
  status: string;
}

export interface Reference {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  year: number | null;
  url: string | null;
  doi: string | null;
  type: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
