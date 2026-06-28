import { v4 as uuidv4 } from 'uuid';

import { CommentStatus } from '@knowledge-base-central/shared';

export interface CommentProps {
  id: string;
  assetId: string;
  parentId?: string | null;
  authorId: string;
  content: string;
  status: CommentStatus;
  reportCount?: number;
  createdAt?: Date;
}

export interface CreateCommentProps {
  assetId: string;
  parentId?: string | null;
  authorId: string;
  content: string;
}

const MAX_CONTENT_LENGTH = 2000;

export class Comment {
  readonly id: string;
  readonly assetId: string;
  readonly parentId: string | null;
  readonly authorId: string;
  private _content: string;
  private _status: CommentStatus;
  private _reportCount: number;
  readonly createdAt: Date;

  constructor(props: CommentProps) {
    this.id = props.id;
    this.assetId = props.assetId;
    this.parentId = props.parentId ?? null;
    this.authorId = props.authorId;
    this._content = props.content;
    this._status = props.status;
    this._reportCount = props.reportCount ?? 0;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: CreateCommentProps): Comment {
    const content = props.content.trim();
    if (content.length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new Error(`Comment content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
    }

    return new Comment({
      id: uuidv4(),
      assetId: props.assetId,
      parentId: props.parentId ?? null,
      authorId: props.authorId,
      content,
      status: CommentStatus.PENDING,
      reportCount: 0,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: CommentProps): Comment {
    return new Comment(props);
  }

  get content(): string {
    return this._content;
  }

  get status(): CommentStatus {
    return this._status;
  }

  get reportCount(): number {
    return this._reportCount;
  }

  approve(): void {
    if (this._status === CommentStatus.DELETED) {
      throw new Error('Cannot approve a deleted comment');
    }
    this._status = CommentStatus.APPROVED;
  }

  reject(): void {
    if (this._status === CommentStatus.DELETED) {
      throw new Error('Cannot reject a deleted comment');
    }
    this._status = CommentStatus.REJECTED;
  }

  delete(): void {
    this._status = CommentStatus.DELETED;
  }

  incrementReportCount(): void {
    this._reportCount += 1;
    if (this._reportCount >= 3 && this._status === CommentStatus.APPROVED) {
      this._status = CommentStatus.PENDING;
    }
  }

  toProps(): CommentProps {
    return {
      id: this.id,
      assetId: this.assetId,
      parentId: this.parentId,
      authorId: this.authorId,
      content: this._content,
      status: this._status,
      reportCount: this._reportCount,
      createdAt: this.createdAt,
    };
  }
}
