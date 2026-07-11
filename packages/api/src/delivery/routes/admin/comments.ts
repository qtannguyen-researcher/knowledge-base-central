import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { commentIdParamSchema } from '../../schemas/community.js';
import { CommentStatus } from '@knowledge-base-central/shared';
import { requirePermission } from '../../../auth.js';

export async function registerAdminCommentRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/comments/pending',
    { preHandler: requirePermission(container, 'comment:moderate') },
    async (request, _reply) => {
      const page = parseInt(String(request.query['page'] ?? '1'), 10);
      const limit = parseInt(String(request.query['limit'] ?? '20'), 10);
      const assetId = request.query['assetId'] as string | undefined;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { status: CommentStatus.PENDING };
      if (assetId) where['assetId'] = assetId;

      const [items, total] = await Promise.all([
        container.prisma.comment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            asset: { select: { id: true, slug: true, title: true } },
            author: { select: { id: true, username: true, displayName: true } },
          },
        }),
        container.prisma.comment.count({ where }),
      ]);

      return { items, total, page, limit };
    },
  );

  app.delete(
    '/comments/:id',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission(container, 'comment:moderate'),
    },
    async (request, _reply) => {
      const { id } = request.params;

      const comment = await container.commentRepository.findById(id);
      if (!comment) {
        return reply.status(404).send({ error: 'not_found' });
      }

      await container.commentRepository.delete(id);

      return reply.status(204).send();
    },
  );

  app.post(
    '/comments/:id/approve',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission(container, 'comment:moderate'),
    },
    async (request, _reply) => {
      const { id } = request.params;

      const comment = await container.commentRepository.findById(id);
      if (!comment) {
        return reply.status(404).send({ error: 'not_found' });
      }

      comment.approve();
      await container.commentRepository.save(comment);

      await container.notificationService.send(comment.authorId, 'comment_approved', {
        commentId: comment.id,
        assetId: comment.assetId,
      });

      return reply.status(200).send({ id: comment.id, status: comment.status });
    },
  );

  app.post(
    '/comments/:id/reject',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission(container, 'comment:moderate'),
    },
    async (request, _reply) => {
      const { id } = request.params;

      const comment = await container.commentRepository.findById(id);
      if (!comment) {
        return reply.status(404).send({ error: 'not_found' });
      }

      comment.reject();
      await container.commentRepository.save(comment);

      return reply.status(200).send({ id: comment.id, status: comment.status });
    },
  );
}
