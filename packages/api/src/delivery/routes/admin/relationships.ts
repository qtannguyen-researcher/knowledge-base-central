import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';
import { createRelationshipBodySchema } from '../../schemas/relationship.js';

async function entityExists(container: Container, type: string, id: string): Promise<boolean> {
  switch (type) {
    case 'knowledge_asset':
      return (await container.knowledgeAssetRepository.findById(id)) !== null;
    case 'concept':
      return (await container.prisma.concept.findUnique({ where: { id } })) !== null;
    case 'reference':
      return (await container.prisma.reference.findUnique({ where: { id } })) !== null;
    case 'category':
      return (await container.categoryRepository.findById(id)) !== null;
    default:
      return false;
  }
}

export async function registerAdminRelationshipRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.post(
    '/relationships',
    {
      preHandler: requirePermission('article:update', container),
      schema: { body: createRelationshipBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const [sourceExists, targetExists] = await Promise.all([
        entityExists(container, body.sourceType, body.sourceId),
        entityExists(container, body.targetType, body.targetId),
      ]);

      if (!sourceExists || !targetExists) {
        return reply.status(404).send({ error: 'entity_not_found' });
      }

      const relationship = await container.prisma.relationship.create({
        data: {
          sourceType: body.sourceType,
          sourceId: body.sourceId,
          targetType: body.targetType,
          targetId: body.targetId,
          relationship: body.relationship,
          createdById: request.session.userId ?? null,
        },
      });

      return reply.status(201).send(relationship);
    },
  );

  app.delete(
    '/relationships/:id',
    {
      preHandler: requirePermission('article:update', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      try {
        await container.prisma.relationship.delete({ where: { id: request.params.id } });
        return reply.status(200).send({ ok: true });
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );
}
