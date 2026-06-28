import { ContentType, Difficulty, KnowledgeAssetStatus } from '@knowledge-base-central/shared';
import { z } from 'zod';

export const createAssetBodySchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  contentType: z.nativeEnum(ContentType),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: z.nativeEnum(Difficulty).optional(),
  content: z.string().optional(),
  rawContent: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAssetBodySchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().nullable().optional(),
  contentType: z.nativeEnum(ContentType).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  difficulty: z.nativeEnum(Difficulty).nullable().optional(),
  content: z.string().nullable().optional(),
  rawContent: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const adminListAssetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(KnowledgeAssetStatus).optional(),
  categoryId: z.string().uuid().optional(),
});

export const publicListAssetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categorySlug: z.string().optional(),
  tag: z.string().optional(),
});

export const linkConceptBodySchema = z.object({
  conceptId: z.string().uuid(),
});

export const linkReferenceBodySchema = z.object({
  referenceId: z.string().uuid(),
});
