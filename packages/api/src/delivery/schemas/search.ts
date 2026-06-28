import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  category: z.string().optional(),
  tag: z.string().optional(),
  contentType: z.string().optional(),
  difficulty: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const suggestionsQuerySchema = z.object({
  q: z.string().min(2),
});

export const reindexQuerySchema = z.object({});

export const searchAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().default(7).optional(),
});
