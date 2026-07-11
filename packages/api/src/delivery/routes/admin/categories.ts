import { randomUUID } from 'node:crypto';

import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth.js';
import type { Container } from '../../../container.js';
import { Category } from '../../../domain/category/Category.js';
import { idParamSchema } from '../../schemas/common.js';
import { createCategoryBodySchema, updateCategoryBodySchema } from '../../schemas/category.js';

export async function registerAdminCategoryRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/categories',
    { preHandler: requirePermission(container, 'category:view') },
    async () => {
      const categories = await container.categoryRepository.findAll();
      return categories.map((cat) => cat.toProps());
    },
  );

  app.post(
    '/categories',
    {
      preHandler: requirePermission(container, 'category:create'),
      schema: { body: createCategoryBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const parent = body.parentId
        ? await container.categoryRepository.findById(body.parentId)
        : null;

      if (body.parentId && !parent) {
        return reply.status(404).send({ error: 'parent_not_found' });
      }

      const category = new Category({
        id: randomUUID(),
        slug: body.slug,
        name: body.name,
        description: body.description ?? null,
        parentId: body.parentId ?? null,
        path: Category.buildPath(body.slug, parent ?? undefined),
        depth: parent ? parent.depth + 1 : 0,
      });

      await container.categoryRepository.save(category);
      return reply.status(201).send(category.toProps());
    },
  );

  app.put(
    '/categories/:id',
    {
      preHandler: requirePermission(container, 'category:update'),
      schema: { params: idParamSchema, body: updateCategoryBodySchema },
    },
    async (request, reply) => {
      const existing = await container.categoryRepository.findById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const body = request.body;
      const parentId = body.parentId !== undefined ? body.parentId : existing.parentId;
      const parent = parentId ? await container.categoryRepository.findById(parentId) : null;
      if (parentId && !parent) {
        return reply.status(404).send({ error: 'parent_not_found' });
      }

      const slug = body.slug ?? existing.slug;
      const updated = new Category({
        ...existing.toProps(),
        slug,
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        parentId,
        path: Category.buildPath(slug, parent ?? undefined),
        depth: parent ? parent.depth + 1 : 0,
      });

      await container.categoryRepository.save(updated);
      return updated.toProps();
    },
  );

  app.delete(
    '/categories/:id',
    {
      preHandler: requirePermission(container, 'category:delete'),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const existing = await container.categoryRepository.findById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const [childCount, assetCount] = await Promise.all([
        container.prisma.category.count({ where: { parentId: existing.id } }),
        container.prisma.knowledgeAsset.count({ where: { categoryId: existing.id } }),
      ]);

      if (childCount > 0 || assetCount > 0) {
        return reply.status(409).send({ error: 'category_in_use' });
      }

      await container.categoryRepository.delete(existing.id);
      await container.auditService.log(request.user?.id, 'delete', 'category', existing.id);
      return reply.status(200).send({ ok: true });
    },
  );
}
