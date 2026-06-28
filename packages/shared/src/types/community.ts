export const CommentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DELETED: 'DELETED',
} as const;

export type CommentStatus = (typeof CommentStatus)[keyof typeof CommentStatus];

export const CorrectionStatus = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  IMPLEMENTED: 'IMPLEMENTED',
} as const;

export type CorrectionStatus = (typeof CorrectionStatus)[keyof typeof CorrectionStatus];
