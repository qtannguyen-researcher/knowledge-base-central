import { z } from 'zod';

export const createTagBodySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
});

export const updateTagBodySchema = z.object({
  name: z.string().min(1),
});
