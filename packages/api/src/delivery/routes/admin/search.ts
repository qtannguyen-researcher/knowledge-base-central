import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth.js';
import type { Container } from '../../../container.js';
import { SearchService } from '../../../application/search/SearchService.js';
import { reindexQuerySchema, searchAnalyticsQuerySchema } from '../../schemas/search.js';

export async function registerAdminSearchRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  const searchService = new SearchService(container.searchRepository);

  app.post(
    '/search/reindex',
    {
      preHandler: requirePermission(container, 'search:manage'),
      schema: { body: reindexQuerySchema },
    },
    async (_request, reply) => {
      await searchService.reindexPublished();
      return reply.status(202).send({ rebuilding: true });
    },
  );

  app.get(
    '/search/analytics',
    {
      preHandler: requirePermission(container, 'audit:view'),
      schema: { querystring: searchAnalyticsQuerySchema },
    },
    async (request) => {
      const days = request.query.days ?? 7;
      const analytics = await container.prisma.$queryRaw<{ query: string; count: bigint }[]>`
        SELECT query, COUNT(*)::bigint AS count
        FROM search_queries
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY query
        ORDER BY count DESC, query ASC
        LIMIT 20
      `;

      const zeroResults = await container.prisma.$queryRaw<{ query: string; count: bigint }[]>`
        SELECT query, COUNT(*)::bigint AS count
        FROM search_queries
        WHERE created_at >= NOW() - INTERVAL '${days} days'
          AND result_count = 0
        GROUP BY query
        ORDER BY count DESC, query ASC
        LIMIT 20
      `;

      return {
        topQueries: analytics.map((row) => ({ query: row.query, count: Number(row.count) })),
        zeroResults: zeroResults.map((row) => ({ query: row.query, count: Number(row.count) })),
      };
    },
  );
}
