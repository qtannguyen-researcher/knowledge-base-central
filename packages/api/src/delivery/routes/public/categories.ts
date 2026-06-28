import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';
import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { buildCategoryTree, toAssetJson } from '../../helpers.js';
import { slugParamSchema } from '../../schemas/common.js';

export async function registerPublicCategoryRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get('/categories', async () => {
    const categories = await container.prisma.category.findMany({
      orderBy: [{ depth: 'asc' }, { path: 'asc' }],
    });
    return buildCategoryTree(categories);
  });

  app.get('/categories/:slug', { schema: { params: slugParamSchema } }, async (request, reply) => {
    const category = await container.categoryRepository.findBySlug(request.params.slug);
    if (!category) {
      return reply.status(404).send({ error: 'not_found' });
    }

    const assets = await container.knowledgeAssetRepository.findAll({
      status: KnowledgeAssetStatus.PUBLISHED,
      categoryId: category.id,
      pageSize: 50,
    });

    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      path: category.path,
      depth: category.depth,
      assets: assets.items.map(toAssetJson),
    };
  });
}
