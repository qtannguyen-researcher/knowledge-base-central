import { CommentStatus } from '@knowledge-base-central/shared';

import { Comment } from './Comment.js';

export interface CommentFilter {
  status?: CommentStatus;
}

export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findByAsset(assetId: string, filter?: CommentFilter): Promise<Comment[]>;
  findThread(parentId: string): Promise<Comment[]>;
  save(comment: Comment): Promise<void>;
  delete(id: string): Promise<void>;
}
