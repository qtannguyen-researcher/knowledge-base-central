import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { toAssetJson } from '../../helpers.js';
import { slugParamSchema } from '../../schemas/common.js';

export async function registerPublicLearningPathRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get('/learning-paths', async () => {
    const paths = await container.prisma.learningPath.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
    });
    return paths;
  });

  app.get(
    '/learning-paths/:slug',
    { schema: { params: slugParamSchema } },
    async (request, reply) => {
      const path = await container.prisma.learningPath.findUnique({
        where: { slug: request.params.slug },
        include: {
          items: {
            orderBy: { position: 'asc' },
            include: { asset: true },
          },
        },
      });

      if (!path || path.status !== 'PUBLISHED') {
        return reply.status(404).send({ error: 'not_found' });
      }

      const assets = [];
      for (const item of path.items) {
        const asset = await container.knowledgeAssetRepository.findById(item.assetId);
        if (asset) {
          assets.push({ position: item.position, asset: toAssetJson(asset) });
        }
      }

      return {
        id: path.id,
        slug: path.slug,
        title: path.title,
        description: path.description,
        difficulty: path.difficulty,
        estimatedDuration: path.estimatedDuration,
        status: path.status,
        items: assets,
      };
    },
  );
}
