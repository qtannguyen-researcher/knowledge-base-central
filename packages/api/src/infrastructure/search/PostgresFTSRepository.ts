import type { PrismaClient } from '@prisma/client';

import type {
  ISearchRepository,
  SearchQuery,
  SearchResult,
  SearchSuggestion,
} from '../../domain/search/ISearchRepository.js';

interface SearchRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category_slug: string | null;
  tags: string[];
  difficulty: string | null;
  rank: number;
  published_at: Date | null;
}

interface SuggestionRow {
  title: string;
}

export class PostgresFTSRepository implements ISearchRepository {
  constructor(private readonly db: PrismaClient) {}

  async search(query: SearchQuery): Promise<{ results: SearchResult[]; total: number }> {
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const offset = (page - 1) * limit;

    const [results, countRow] = await Promise.all([
      this.db.$queryRaw<SearchRow[]>`
        SELECT
          ka.id,
          ka.slug,
          ka.title,
          ka.summary,
          c.slug AS category_slug,
          array_remove(array_agg(t.slug), NULL) AS tags,
          ka.difficulty,
          ts_rank_cd(ka.search_vector, plainto_tsquery('english', ${query.q})) AS rank,
          ka.published_at
        FROM knowledge_assets ka
          LEFT JOIN categories c ON c.id = ka.category_id
          LEFT JOIN knowledge_asset_tags kat ON kat.asset_id = ka.id
          LEFT JOIN tags t ON t.id = kat.tag_id
        WHERE ka.search_vector @@ plainto_tsquery('english', ${query.q})
          AND ka.status = 'PUBLISHED'
          AND ka.deleted_at IS NULL
          AND (${query.categorySlug ?? null}::text IS NULL OR c.slug = ${query.categorySlug ?? null})
          AND (${query.tag ?? null}::text IS NULL OR t.slug = ${query.tag ?? null})
          AND (${query.contentType ?? null}::text IS NULL OR ka.content_type = ${query.contentType ?? null})
          AND (${query.difficulty ?? null}::text IS NULL OR ka.difficulty = ${query.difficulty ?? null})
        GROUP BY ka.id, c.slug, ka.published_at
        ORDER BY rank DESC, ka.published_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      this.db.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT ka.id)::bigint AS count
        FROM knowledge_assets ka
          LEFT JOIN categories c ON c.id = ka.category_id
          LEFT JOIN knowledge_asset_tags kat ON kat.asset_id = ka.id
          LEFT JOIN tags t ON t.id = kat.tag_id
        WHERE ka.search_vector @@ plainto_tsquery('english', ${query.q})
          AND ka.status = 'PUBLISHED'
          AND ka.deleted_at IS NULL
          AND (${query.categorySlug ?? null}::text IS NULL OR c.slug = ${query.categorySlug ?? null})
          AND (${query.tag ?? null}::text IS NULL OR t.slug = ${query.tag ?? null})
          AND (${query.contentType ?? null}::text IS NULL OR ka.content_type = ${query.contentType ?? null})
          AND (${query.difficulty ?? null}::text IS NULL OR ka.difficulty = ${query.difficulty ?? null})
      `,
    ]);

    return {
      results: results.map((row) => ({
        assetId: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary ?? '',
        categorySlug: row.category_slug ?? '',
        tags: row.tags,
        difficulty: row.difficulty ?? undefined,
        rank: Number(row.rank),
        publishedAt: row.published_at?.toISOString() ?? new Date(0).toISOString(),
      })),
      total: Number(countRow[0]?.count ?? 0),
    };
  }

  async indexAsset(_assetId: string): Promise<void> {
    // no-op: search_vector trigger handles updates on INSERT/UPDATE
  }

  async removeAsset(_assetId: string): Promise<void> {
    // no-op: soft delete + trigger handles cleanup
  }

  async suggest(q: string, limit = 5): Promise<SearchSuggestion[]> {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      return [];
    }

    const sanitized = trimmed.replace(/[^a-zA-Z0-9]/g, '').trim();
    const firstWord = sanitized.split(/\s+/)[0];
    if (!firstWord || firstWord.length < 2) {
      return [];
    }

    const prefixQuery = `${firstWord}:*`;
    const rows = await this.db.$queryRaw<SuggestionRow[]>`
      SELECT ka.title
      FROM knowledge_assets ka
      WHERE ka.search_vector @@ to_tsquery('english', ${prefixQuery})
        AND ka.status = 'PUBLISHED'
        AND ka.deleted_at IS NULL
      ORDER BY ts_rank_cd(ka.search_vector, to_tsquery('english', ${prefixQuery})) DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({ title: row.title }));
  }

  async reindexPublished(): Promise<void> {
    await this.db.$executeRaw`
      UPDATE knowledge_assets
      SET search_vector = to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(summary, '') || ' ' ||
        coalesce(content, '')
      )
      WHERE status = 'PUBLISHED'
        AND deleted_at IS NULL
    `;
  }
}
