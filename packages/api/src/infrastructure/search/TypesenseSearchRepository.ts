import type {
  ISearchRepository,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
} from '../../domain/search/ISearchRepository.js';

export class NotImplementedError extends Error {
  constructor(message = 'Not implemented') {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/**
 * Placeholder Typesense search repository.
 *
 * Migration path for Phase 2+:
 * 1. Create a `knowledge_assets` collection with fields:
 *    - id (string)
 *    - title (string)
 *    - summary (string)
 *    - category_slug (string)
 *    - tags (string[])
 *    - difficulty (string)
 *    - published_at (int32)
 * 2. Replace `NotImplementedError` with Typesense client calls.
 * 3. Keep `indexAsset` and `removeAsset` as real upsert/delete operations.
 * 4. Use `SEARCH_BACKEND=typesense` to enable this adapter.
 */
export class TypesenseSearchRepository implements ISearchRepository {
  async search(_query: SearchQuery): Promise<{ results: SearchResult[]; total: number }> {
    throw new NotImplementedError('Typesense search is not implemented yet');
  }

  async indexAsset(_assetId: string): Promise<void> {
    throw new NotImplementedError('Typesense indexAsset is not implemented yet');
  }

  async removeAsset(_assetId: string): Promise<void> {
    throw new NotImplementedError('Typesense removeAsset is not implemented yet');
  }

  async suggest(_query: string, _limit?: number): Promise<SearchSuggestion[]> {
    throw new NotImplementedError('Typesense suggest is not implemented yet');
  }

  async reindexPublished(): Promise<void> {
    throw new NotImplementedError('Typesense reindexPublished is not implemented yet');
  }
}
