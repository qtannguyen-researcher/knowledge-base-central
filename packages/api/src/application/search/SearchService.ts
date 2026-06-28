import type { ISearchRepository } from '../../domain/search/ISearchRepository.js';

export interface SearchAnalyticsInput {
  query: string;
  resultCount: number;
}

export class SearchService {
  constructor(private readonly searchRepository: ISearchRepository) {}

  async search(query: Record<string, unknown>) {
    const q = typeof query.q === 'string' ? query.q.trim() : '';
    if (!q) {
      throw new Error('query_required');
    }

    const limit = typeof query.limit === 'number' ? query.limit : 20;
    const page = typeof query.page === 'number' ? query.page : 1;

    const result = await this.searchRepository.search({
      q,
      categorySlug: typeof query.category === 'string' ? query.category : undefined,
      tag: typeof query.tag === 'string' ? query.tag : undefined,
      contentType: typeof query.contentType === 'string' ? query.contentType : undefined,
      difficulty: typeof query.difficulty === 'string' ? query.difficulty : undefined,
      page,
      limit,
    });

    return {
      results: result.results,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  async suggest(q: string, limit = 5) {
    const query = q.trim();
    if (!query || query.length < 2) {
      return [];
    }

    return this.searchRepository.suggest(query, limit);
  }

  async reindexPublished() {
    return this.searchRepository.reindexPublished();
  }

  async recordQuery(_analytics: SearchAnalyticsInput) {
    // Analytics recording is handled at the delivery layer
    // This method exists for explicit invocation when needed
    return;
  }
}
