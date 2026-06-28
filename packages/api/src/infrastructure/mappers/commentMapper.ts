import type { Comment as PrismaComment, Prisma } from '@prisma/client';

import { CommentStatus } from '@knowledge-base-central/shared';

import { Comment } from '../../domain/community/Comment.js';

export function toDomainComment(record: PrismaComment): Comment {
  return Comment.reconstitute({
    id: record.id,
    assetId: record.assetId,
    parentId: record.parentId,
    authorId: record.authorId,
    content: record.content,
    status: record.status as CommentStatus,
    reportCount: record.reportCount,
    createdAt: record.createdAt,
  });
}

export function toPrismaComment(comment: Comment): Prisma.CommentUncheckedCreateInput {
  const props = comment.toProps();
  return {
    id: props.id,
    assetId: props.assetId,
    parentId: props.parentId ?? null,
    authorId: props.authorId,
    content: props.content,
    status: props.status,
    reportCount: props.reportCount ?? 0,
    createdAt: props.createdAt ?? new Date(),
  };
}
