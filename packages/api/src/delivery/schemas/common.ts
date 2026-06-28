import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export const versionIdParamSchema = z.object({
  id: z.string().uuid(),
  versionId: z.string().uuid(),
});

export const conceptLinkParamSchema = z.object({
  id: z.string().uuid(),
  conceptId: z.string().uuid(),
});

export const referenceLinkParamSchema = z.object({
  id: z.string().uuid(),
  refId: z.string().uuid(),
});
