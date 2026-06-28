import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';
import { createConceptBodySchema, updateConceptBodySchema } from '../../schemas/concept.js';

export async function registerAdminConceptRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/concepts',
    { preHandler: requirePermission('concept:view', container) },
    async (request, reply) => {
      const page = parseInt(String(request.query['page'] ?? '1'), 10);
      const limit = parseInt(String(request.query['limit'] ?? '50'), 10);
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        container.prisma.concept.findMany({
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        container.prisma.concept.count(),
      ]);
      return reply.send({ items, total, page, limit });
    },
  );

  app.post(
    '/concepts',
    {
      preHandler: requirePermission('concept:create', container),
      schema: { body: createConceptBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const concept = await container.prisma.concept.create({
        data: {
          slug: body.slug,
          name: body.name,
          aliases: body.aliases,
          description: body.description ?? null,
          domain: body.domain ?? null,
        },
      });
      return reply.status(201).send(concept);
    },
  );

  app.put(
    '/concepts/:id',
    {
      preHandler: requirePermission('concept:update', container),
      schema: { params: idParamSchema, body: updateConceptBodySchema },
    },
    async (request, reply) => {
      try {
        const body = request.body;
        const concept = await container.prisma.concept.update({
          where: { id: request.params.id },
          data: {
            ...(body.slug !== undefined ? { slug: body.slug } : {}),
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.aliases !== undefined ? { aliases: body.aliases } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.domain !== undefined ? { domain: body.domain } : {}),
          },
        });
        return concept;
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );

  app.delete(
    '/concepts/:id',
    {
      preHandler: requirePermission('concept:delete', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      try {
        await container.prisma.knowledgeAssetConcept.deleteMany({
          where: { conceptId: request.params.id },
        });
        await container.prisma.concept.delete({ where: { id: request.params.id } });
        await container.auditService.log(
          request.session.userId,
          'delete',
          'concept',
          request.params.id,
        );
        return reply.status(200).send({ ok: true });
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );
}
