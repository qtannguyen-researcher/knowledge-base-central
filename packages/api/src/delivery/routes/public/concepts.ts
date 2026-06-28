import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { toAssetJson } from '../../helpers.js';
import { slugParamSchema } from '../../schemas/common.js';
import { listConceptsQuerySchema } from '../../schemas/concept.js';

export async function registerPublicConceptRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get('/concepts', { schema: { querystring: listConceptsQuerySchema } }, async (request) => {
    const { page, limit } = request.query;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      container.prisma.concept.findMany({
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      container.prisma.concept.count(),
    ]);

    return { items, total, page, limit };
  });

  app.get('/concepts/:slug', { schema: { params: slugParamSchema } }, async (request, reply) => {
    const concept = await container.prisma.concept.findUnique({
      where: { slug: request.params.slug },
    });
    if (!concept) {
      return reply.status(404).send({ error: 'not_found' });
    }

    const links = await container.prisma.knowledgeAssetConcept.findMany({
      where: { conceptId: concept.id },
      include: { asset: true },
    });

    const assets = [];
    for (const link of links) {
      if (link.asset.status !== 'PUBLISHED' || link.asset.deletedAt) {
        continue;
      }
      const asset = await container.knowledgeAssetRepository.findById(link.asset.id);
      if (asset) {
        assets.push(toAssetJson(asset));
      }
    }

    return { ...concept, assets };
  });
}
