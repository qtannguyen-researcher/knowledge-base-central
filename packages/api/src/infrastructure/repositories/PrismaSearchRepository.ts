import type { PrismaClient } from '@prisma/client';

import type {
  ISearchRepository,
  SearchQuery,
  SearchResult,
} from '../../domain/search/ISearchRepository.js';

interface RawSearchRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  rank: number;
}

export class PrismaSearchRepository implements ISearchRepository {
  constructor(private readonly db: PrismaClient) {}

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const status = query.status ?? 'PUBLISHED';

    const rows = await this.db.$queryRaw<RawSearchRow[]>`
      SELECT
        ka.id,
        ka.slug,
        ka.title,
        ka.summary,
        ts_rank(ka.search_vector, plainto_tsquery('english', ${query.query})) AS rank
      FROM knowledge_assets ka
      WHERE ka.search_vector @@ plainto_tsquery('english', ${query.query})
        AND ka.status = ${status}::text
        AND ka.deleted_at IS NULL
      ORDER BY rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      rank: Number(row.rank),
    }));
  }
}
