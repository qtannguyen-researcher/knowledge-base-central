import { z } from 'zod';

export const createCategoryBodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const updateCategoryBodySchema = z.object({
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});
