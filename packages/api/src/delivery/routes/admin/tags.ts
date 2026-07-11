import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';
import { createTagBodySchema, updateTagBodySchema } from '../../schemas/tag.js';

export async function registerAdminTagRoutes(app: ZodFastify, container: Container): Promise<void> {
  app.get('/tags', { preHandler: requirePermission(container, 'tag:view') }, async () => {
    const tags = await container.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    return tags;
  });

  app.post(
    '/tags',
    {
      preHandler: requirePermission(container, 'tag:create'),
      schema: { body: createTagBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const tag = await container.prisma.tag.create({
        data: { slug: body.slug, name: body.name },
      });
      return reply.status(201).send(tag);
    },
  );

  app.put(
    '/tags/:id',
    {
      preHandler: requirePermission(container, 'tag:update'),
      schema: { params: idParamSchema, body: updateTagBodySchema },
    },
    async (request, reply) => {
      try {
        const tag = await container.prisma.tag.update({
          where: { id: request.params.id },
          data: { name: request.body.name },
        });
        return tag;
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );

  app.delete(
    '/tags/:id',
    {
      preHandler: requirePermission(container, 'tag:delete'),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      try {
        await container.prisma.knowledgeAssetTag.deleteMany({
          where: { tagId: request.params.id },
        });
        await container.prisma.tag.delete({ where: { id: request.params.id } });
        await container.auditService.log(request.user?.id, 'delete', 'tag', request.params.id);
        return reply.status(200).send({ ok: true });
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );
}
