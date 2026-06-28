import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';
import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { toAssetJson } from '../../helpers.js';
import { publicListAssetsQuerySchema } from '../../schemas/asset.js';
import { slugParamSchema } from '../../schemas/common.js';

export async function registerPublicAssetRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get('/assets', { schema: { querystring: publicListAssetsQuerySchema } }, async (request) => {
    const query = request.query;
    const result = await container.knowledgeAssetRepository.findAll({
      page: query.page,
      pageSize: query.limit,
      status: KnowledgeAssetStatus.PUBLISHED,
      ...(query.categorySlug ? { categorySlug: query.categorySlug } : {}),
      ...(query.tag ? { tagSlug: query.tag } : {}),
    });

    return {
      items: result.items.map(toAssetJson),
      total: result.total,
      page: result.page,
      limit: result.pageSize,
    };
  });

  app.get('/assets/:slug', { schema: { params: slugParamSchema } }, async (request, reply) => {
    const asset = await container.knowledgeAssetRepository.findBySlug(request.params.slug);
    if (!asset || asset.status !== KnowledgeAssetStatus.PUBLISHED || asset.deletedAt) {
      return reply.status(404).send({ error: 'not_found' });
    }
    return toAssetJson(asset);
  });

  app.get(
    '/assets/:slug/relationships',
    { schema: { params: slugParamSchema } },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findBySlug(request.params.slug);
      if (!asset || asset.status !== KnowledgeAssetStatus.PUBLISHED) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const relationships = await container.prisma.relationship.findMany({
        where: {
          OR: [
            { sourceType: 'knowledge_asset', sourceId: asset.id },
            { targetType: 'knowledge_asset', targetId: asset.id },
          ],
        },
      });

      return relationships;
    },
  );

  app.get(
    '/assets/:slug/attachments',
    { schema: { params: slugParamSchema } },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findBySlug(request.params.slug);
      if (!asset || asset.status !== KnowledgeAssetStatus.PUBLISHED) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const attachments = await container.prisma.attachment.findMany({
        where: {
          assetId: asset.id,
          status: { in: ['UPLOADED', 'VALIDATED', 'AVAILABLE'] },
        },
        select: {
          id: true,
          filename: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
        },
      });

      return attachments.map((a) => ({
        ...a,
        sizeBytes: a.sizeBytes ? Number(a.sizeBytes) : null,
        uploadedAt: a.uploadedAt.toISOString(),
      }));
    },
  );
}
