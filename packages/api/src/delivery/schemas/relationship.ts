import { RelationshipType } from '@knowledge-base-central/shared';
import { z } from 'zod';

export const createRelationshipBodySchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().uuid(),
  targetType: z.string().min(1),
  targetId: z.string().uuid(),
  relationship: z.nativeEnum(RelationshipType),
});
