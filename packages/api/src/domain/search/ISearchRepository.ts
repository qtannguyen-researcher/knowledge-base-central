export interface SearchQuery {
  q: string;
  categorySlug?: string;
  tag?: string;
  contentType?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
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

export interface SearchSuggestion {
  title: string;
}

export interface ISearchRepository {
  search(query: SearchQuery): Promise<{ results: SearchResult[]; total: number }>;
  indexAsset(assetId: string): Promise<void>;
  removeAsset(assetId: string): Promise<void>;
  suggest(query: string, limit?: number): Promise<SearchSuggestion[]>;
  reindexPublished(): Promise<void>;
}
