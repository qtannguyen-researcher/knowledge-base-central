import { z } from 'zod';

export const createCommentBodySchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const commentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createCorrectionBodySchema = z.object({
  description: z.string().min(1).max(1000),
  suggestion: z.string().max(2000).optional(),
});

export const correctionReviewBodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export const listCorrectionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'IMPLEMENTED']).optional(),
  assetId: z.string().uuid().optional(),
});

export const listNotificationsQuerySchema = z.object({
  status: z.enum(['unread', 'all']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
