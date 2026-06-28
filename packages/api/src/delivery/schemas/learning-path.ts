import { Difficulty } from '@knowledge-base-central/shared';
import { z } from 'zod';

export const createLearningPathBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  estimatedDuration: z.number().int().positive().optional(),
  assetIds: z.array(z.string().uuid()).default([]),
});

export const updateLearningPathBodySchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  difficulty: z.nativeEnum(Difficulty).nullable().optional(),
  estimatedDuration: z.number().int().positive().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const reorderLearningPathItemsBodySchema = z.object({
  assetIds: z.array(z.string().uuid()),
});
