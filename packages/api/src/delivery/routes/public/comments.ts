import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { slugParamSchema } from '../../schemas/common.js';
import { listCommentsQuerySchema } from '../../schemas/community.js';
import { CommentStatus } from '@knowledge-base-central/shared';

interface CommentWithAuthor {
  id: string;
  parentId: string | null;
  content: string;
  status: string;
  reportCount: number;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
  };
  replies?: CommentWithAuthor[];
}

function buildCommentTree(comments: CommentWithAuthor[]): CommentWithAuthor[] {
  const map = new Map<string, CommentWithAuthor>();
  const roots: CommentWithAuthor[] = [];

  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of map.values()) {
    if (comment.parentId) {
      const parent = map.get(comment.parentId);
      if (parent) {
        parent.replies!.push(comment);
      } else {
        roots.push(comment);
      }
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

function formatComment(comment: CommentWithAuthor) {
  return {
    id: comment.id,
    parentId: comment.parentId,
    content: comment.content,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      displayName: comment.author.displayName,
    },
    reportCount: comment.reportCount,
    createdAt: comment.createdAt.toISOString(),
    replies: (comment.replies || []).map(formatComment),
  };
}

export async function registerPublicCommentRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/assets/:slug/comments',
    {
      schema: {
        params: slugParamSchema,
        querystring: listCommentsQuerySchema,
      },
    },
    async (request, reply) => {
      const { slug } = request.params;
      const asset = await container.knowledgeAssetRepository.findBySlug(slug);

      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const comments = await container.prisma.comment.findMany({
        where: {
          assetId: asset.id,
          status: CommentStatus.APPROVED,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const tree = buildCommentTree(comments as CommentWithAuthor[]);

      return tree.map(formatComment);
    },
  );
}
