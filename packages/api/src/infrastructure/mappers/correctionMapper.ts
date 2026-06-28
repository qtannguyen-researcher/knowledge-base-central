import type { CorrectionRequest as PrismaCorrectionRequest, Prisma } from '@prisma/client';

import { CorrectionStatus } from '@knowledge-base-central/shared';

import { CorrectionRequest } from '../../domain/community/CorrectionRequest.js';

export function toDomainCorrectionRequest(record: PrismaCorrectionRequest): CorrectionRequest {
  return CorrectionRequest.reconstitute({
    id: record.id,
    assetId: record.assetId,
    submittedBy: record.submittedBy,
    description: record.description,
    suggestion: record.suggestion,
    status: record.status as CorrectionStatus,
    reviewedById: record.reviewedById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPrismaCorrectionRequest(
  correction: CorrectionRequest,
): Prisma.CorrectionRequestUncheckedCreateInput {
  const props = correction.toProps();
  return {
    id: props.id,
    assetId: props.assetId,
    submittedBy: props.submittedBy,
    description: props.description,
    suggestion: props.suggestion,
    status: props.status,
    reviewedById: props.reviewedById,
    createdAt: props.createdAt ?? new Date(),
    updatedAt: props.updatedAt ?? new Date(),
  };
}
