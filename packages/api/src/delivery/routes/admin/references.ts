import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';
import { Prisma } from '@prisma/client';
import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';
import { createReferenceBodySchema, updateReferenceBodySchema } from '../../schemas/reference.js';

export async function registerAdminReferenceRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/references',
    { preHandler: requirePermission(container, 'reference:view') },
    async (request, _reply) => {
      const page = parseInt(String(request.query['page'] ?? '1'), 10);
      const limit = parseInt(String(request.query['limit'] ?? '20'), 10);
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

  app.post(
    '/references',
    {
      preHandler: requirePermission(container, 'reference:create'),
      schema: { body: createReferenceBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const reference = await container.prisma.reference.create({
        data: {
          slug: body.slug,
          title: body.title,
          authors: body.authors,
          year: body.year ?? null,
          publisher: body.publisher ?? null,
          url: body.url ?? null,
          doi: body.doi ?? null,
          refType: body.refType,
          ...(body.metadata !== undefined ? { metadata: body.metadata as object } : {}),
        },
      });
      return reply.status(201).send(reference);
    },
  );

  app.put(
    '/references/:id',
    {
      preHandler: requirePermission(container, 'reference:update'),
      schema: { params: idParamSchema, body: updateReferenceBodySchema },
    },
    async (request, reply) => {
      try {
        const body = request.body;
        const reference = await container.prisma.reference.update({
          where: { id: request.params.id },
          data: {
            ...(body.slug !== undefined ? { slug: body.slug } : {}),
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.authors !== undefined ? { authors: body.authors } : {}),
            ...(body.year !== undefined ? { year: body.year } : {}),
            ...(body.publisher !== undefined ? { publisher: body.publisher } : {}),
            ...(body.url !== undefined ? { url: body.url } : {}),
            ...(body.doi !== undefined ? { doi: body.doi } : {}),
            ...(body.refType !== undefined ? { refType: body.refType } : {}),
            ...(body.metadata !== undefined
              ? {
                  metadata:
                    body.metadata === null
                      ? Prisma.JsonNull
                      : (body.metadata as Prisma.InputJsonValue),
                }
              : {}),
          },
        });
        return reference;
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );

  app.delete(
    '/references/:id',
    {
      preHandler: requirePermission(container, 'reference:delete'),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const links = await container.prisma.knowledgeAssetReference.findMany({
        where: { referenceId: request.params.id },
        include: { asset: true },
      });

      const linkedToPublished = links.some(
        (l) => l.asset.status === KnowledgeAssetStatus.PUBLISHED && !l.asset.deletedAt,
      );
      if (linkedToPublished) {
        return reply.status(409).send({ error: 'reference_linked_to_published_asset' });
      }

      try {
        await container.prisma.knowledgeAssetReference.deleteMany({
          where: { referenceId: request.params.id },
        });
        await container.prisma.reference.delete({ where: { id: request.params.id } });
        await container.auditService.log(
          request.user?.id,
          'delete',
          'reference',
          request.params.id,
        );
        return reply.status(200).send({ ok: true });
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );
}
