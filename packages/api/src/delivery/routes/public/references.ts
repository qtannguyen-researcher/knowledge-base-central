import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { slugParamSchema } from '../../schemas/common.js';
import { listReferencesQuerySchema } from '../../schemas/reference.js';

export async function registerPublicReferenceRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/references',
    { schema: { querystring: listReferencesQuerySchema } },
    async (request) => {
      const { page, limit } = request.query;
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        container.prisma.reference.findMany({
          skip,
          take: limit,
          orderBy: { title: 'asc' },
        }),
        container.prisma.reference.count(),
      ]);
      return { items, total, page, limit };
    },
  );

  app.get('/references/:slug', { schema: { params: slugParamSchema } }, async (request, reply) => {
    const reference = await container.prisma.reference.findUnique({
      where: { slug: request.params.slug },
    });
    if (!reference) {
      return reply.status(404).send({ error: 'not_found' });
    }
    return reference;
  });
}
