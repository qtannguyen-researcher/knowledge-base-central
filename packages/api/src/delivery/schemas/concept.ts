import { z } from 'zod';

export const createConceptBodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  description: z.string().optional(),
  domain: z.string().optional(),
});

export const updateConceptBodySchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  aliases: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
});

export const listConceptsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
