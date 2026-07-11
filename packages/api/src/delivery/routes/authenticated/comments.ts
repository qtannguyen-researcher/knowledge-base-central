import { z } from 'zod';
import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { slugParamSchema } from '../../schemas/common.js';
import { createCommentBodySchema } from '../../schemas/community.js';
import { CommentStatus } from '@knowledge-base-central/shared';
import { requireAuth } from '../../../auth.js';
import { sanitizeText } from '../../../infrastructure/sanitization/textSanitizer.js';

const COMMENT_RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const COMMENT_RATE_LIMIT_MAX = 10;

export async function registerAuthenticatedCommentRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.post(
    '/assets/:slug/comments',
    {
      schema: {
        params: slugParamSchema,
        body: createCommentBodySchema,
      },
      preHandler: requireAuth(container),
    },
    async (request, reply) => {
      const { slug } = request.params;
      const { content, parentId } = request.body;
      const userId = request.user!.id;

      const asset = await container.knowledgeAssetRepository.findBySlug(slug);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const windowStart = new Date(Date.now() - COMMENT_RATE_LIMIT_WINDOW);
      const count = await container.prisma.comment.count({
        where: {
          authorId: userId,
          createdAt: { gte: windowStart },
        },
      });

      if (count >= COMMENT_RATE_LIMIT_MAX) {
        return reply.status(429).send({
          error: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Maximum ${COMMENT_RATE_LIMIT_MAX} comments per hour.`,
        });
      }

      if (parentId) {
        const parentComment = await container.commentRepository.findById(parentId);
        if (!parentComment || parentComment.assetId !== asset.id) {
          return reply.status(400).send({ error: 'invalid_parent_id' });
        }
      }

      const sanitizedContent = sanitizeText(content);

      const { Comment } = await import('../../../domain/community/Comment.js');
      const newComment = Comment.create({
        assetId: asset.id,
        authorId: userId,
        content: sanitizedContent,
        parentId: parentId || null,
      });

      await container.commentRepository.save(newComment);

      if (asset.authorId) {
        await container.notificationService.send(asset.authorId, 'new_comment', {
          commentId: newComment.id,
          assetSlug: slug,
          authorId: userId,
        });
      }

      return reply.status(201).send({
        id: newComment.id,
        status: newComment.status,
      });
    },
  );

  app.post(
    '/assets/:slug/comments/:id/report',
    {
      schema: {
        params: slugParamSchema.extend({ id: z.string().uuid() }),
      },
      preHandler: requireAuth(container),
    },
    async (request, reply) => {
      const { slug, id } = request.params;

      const asset = await container.knowledgeAssetRepository.findBySlug(slug);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const comment = await container.prisma.comment.findUnique({
        where: { id },
      });

      if (!comment || comment.assetId !== asset.id) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const updatedComment = await container.prisma.comment.update({
        where: { id },
        data: {
          reportCount: { increment: 1 },
        },
      });

      if (updatedComment.reportCount >= 3 && updatedComment.status === CommentStatus.APPROVED) {
        await container.prisma.comment.update({
          where: { id },
          data: { status: CommentStatus.PENDING },
        });
      }

      return reply.status(200).send({ success: true });
    },
  );
}
