import type { PrismaClient } from '@prisma/client';

import type {
  ICommentRepository,
  CommentFilter,
} from '../../domain/community/ICommentRepository.js';
import type { Comment } from '../../domain/community/Comment.js';

import { toDomainComment, toPrismaComment } from '../mappers/commentMapper.js';

export class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const record = await this.db.comment.findUnique({ where: { id } });
    return record ? toDomainComment(record) : null;
  }

  async findByAsset(assetId: string, filter?: CommentFilter) {
    const where: Prisma.CommentWhereInput = { assetId };
    if (filter?.status) {
      where.status = filter.status;
    }

    const records = await this.db.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toDomainComment);
  }

  async findThread(parentId: string) {
    const records = await this.db.comment.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toDomainComment);
  }

  async save(comment: Comment) {
    const data = toPrismaComment(comment);
    await this.db.comment.upsert({
      where: { id: comment.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string) {
    await this.db.comment.delete({ where: { id } });
  }
}
