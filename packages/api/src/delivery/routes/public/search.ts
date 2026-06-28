import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { SearchService } from '../../../application/search/SearchService.js';
import { searchQuerySchema, suggestionsQuerySchema } from '../../schemas/search.js';

export async function registerPublicSearchRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  const searchService = new SearchService(container.searchRepository);

  app.get(
    '/search',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
        },
      },
      schema: { querystring: searchQuerySchema },
    },
    async (request, reply) => {
      const query = request.query;

      try {
        const result = await searchService.search({
          q: query.q,
          category: query.category,
          tag: query.tag,
          contentType: query.contentType,
          difficulty: query.difficulty,
          page: query.page,
          limit: query.limit,
        });

        const results = result.results.map((item) => ({
          assetId: item.assetId,
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          categorySlug: item.categorySlug,
          tags: item.tags,
          difficulty: item.difficulty,
          rank: item.rank,
          publishedAt: item.publishedAt,
        }));

        void container.prisma.searchQueryLog
          .create({
            data: {
              query: query.q,
              resultCount: result.total,
            },
          })
          .catch(() => {
            // fire-and-forget analytics logging
          });

        return {
          results,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        if (message === 'query_required') {
          return reply.status(400).send({ error: 'query_required' });
        }
        throw error;
      }
    },
  );

  app.get(
    '/search/suggestions',
    {
      config: {
        rateLimit: {
          max: 60,
          timeWindow: '1 minute',
        },
      },
      schema: { querystring: suggestionsQuerySchema },
    },
    async (request) => {
      const { q } = request.query;
      const suggestions = await searchService.suggest(q, 5);
      return { suggestions: suggestions.map((s) => s.title) };
    },
  );
}
