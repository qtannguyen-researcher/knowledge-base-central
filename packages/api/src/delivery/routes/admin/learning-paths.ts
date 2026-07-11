import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';
import {
  createLearningPathBodySchema,
  reorderLearningPathItemsBodySchema,
  updateLearningPathBodySchema,
} from '../../schemas/learning-path.js';

export async function registerAdminLearningPathRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/learning-paths',
    { preHandler: requirePermission(container, 'learning-path:view') },
    async () => {
      const paths = await container.prisma.learningPath.findMany({
        orderBy: { title: 'asc' },
      });
      return paths;
    },
  );

  app.get(
    '/learning-paths/:id',
    { preHandler: requirePermission(container, 'learning-path:view') },
    async (request, reply) => {
      const path = await container.prisma.learningPath.findUnique({
        where: { id: request.params.id },
        include: {
          items: {
            orderBy: { position: 'asc' },
            include: { asset: true },
          },
        },
      });
      if (!path) {
        return reply.status(404).send({ error: 'not_found' });
      }
      return path;
    },
  );

  app.post(
    '/learning-paths',
    {
      preHandler: requirePermission(container, 'learning-path:create'),
      schema: { body: createLearningPathBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const path = await container.prisma.learningPath.create({
        data: {
          slug: body.slug,
          title: body.title,
          description: body.description ?? null,
          difficulty: body.difficulty ?? null,
          estimatedDuration: body.estimatedDuration ?? null,
          createdById: request.user?.id ?? null,
          items: {
            create: body.assetIds.map((assetId, index) => ({
              assetId,
              position: index,
            })),
          },
        },
        include: { items: true },
      });
      return reply.status(201).send(path);
    },
  );

  app.put(
    '/learning-paths/:id',
    {
      preHandler: requirePermission(container, 'learning-path:update'),
      schema: { params: idParamSchema, body: updateLearningPathBodySchema },
    },
    async (request, reply) => {
      try {
        const body = request.body;
        const path = await container.prisma.learningPath.update({
          where: { id: request.params.id },
          data: {
            ...(body.slug !== undefined ? { slug: body.slug } : {}),
            ...(body.title !== undefined ? { title: body.title } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
            ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
            ...(body.estimatedDuration !== undefined
              ? { estimatedDuration: body.estimatedDuration }
              : {}),
            ...(body.status !== undefined ? { status: body.status } : {}),
          },
        });
        return path;
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );

  app.put(
    '/learning-paths/:id/items',
    {
      preHandler: requirePermission(container, 'learning-path:update'),
      schema: { params: idParamSchema, body: reorderLearningPathItemsBodySchema },
    },
    async (request, reply) => {
      const path = await container.prisma.learningPath.findUnique({
        where: { id: request.params.id },
      });
      if (!path) {
        return reply.status(404).send({ error: 'not_found' });
      }

      await container.prisma.learningPathItem.deleteMany({
        where: { pathId: request.params.id },
      });

      await container.prisma.learningPathItem.createMany({
        data: request.body.assetIds.map((assetId, index) => ({
          pathId: request.params.id,
          assetId,
          position: index,
        })),
      });

      const items = await container.prisma.learningPathItem.findMany({
        where: { pathId: request.params.id },
        orderBy: { position: 'asc' },
      });

      return items;
    },
  );

  app.delete(
    '/learning-paths/:id',
    {
      preHandler: requirePermission(container, 'learning-path:delete'),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      try {
        await container.prisma.learningPathItem.deleteMany({
          where: { pathId: request.params.id },
        });
        await container.prisma.learningPath.delete({ where: { id: request.params.id } });
        await container.auditService.log(
          request.user?.id,
          'delete',
          'learning_path',
          request.params.id,
        );
        return reply.status(200).send({ ok: true });
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );
}
