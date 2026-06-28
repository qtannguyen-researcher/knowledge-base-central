import { ReferenceType } from '@prisma/client';
import { z } from 'zod';

export const createReferenceBodySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  year: z.number().int().optional(),
  publisher: z.string().optional(),
  url: z.string().url().optional(),
  doi: z.string().optional(),
  refType: z.nativeEnum(ReferenceType),
  metadata: z.record(z.unknown()).optional(),
});

export const updateReferenceBodySchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  authors: z.array(z.string()).optional(),
  year: z.number().int().nullable().optional(),
  publisher: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  doi: z.string().nullable().optional(),
  refType: z.nativeEnum(ReferenceType).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const listReferencesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
