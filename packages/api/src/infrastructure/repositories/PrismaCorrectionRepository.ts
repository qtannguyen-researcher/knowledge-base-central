import type { PrismaClient, Prisma } from '@prisma/client';

import type {
  ICorrectionRepository,
  CorrectionFilter,
} from '../../domain/community/ICorrectionRepository.js';
import type { CorrectionRequest } from '../../domain/community/CorrectionRequest.js';

import {
  toDomainCorrectionRequest,
  toPrismaCorrectionRequest,
} from '../mappers/correctionMapper.js';

export class PrismaCorrectionRepository implements ICorrectionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    const record = await this.db.correctionRequest.findUnique({ where: { id } });
    return record ? toDomainCorrectionRequest(record) : null;
  }

  async findByAsset(assetId: string, filter?: CorrectionFilter) {
    const where: Prisma.CorrectionRequestWhereInput = { assetId };
    if (filter?.status) {
      where.status = filter.status;
    }

    const records = await this.db.correctionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toDomainCorrectionRequest);
  }

  async findBySubmitter(submitterId: string) {
    const records = await this.db.correctionRequest.findMany({
      where: { submittedBy: submitterId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toDomainCorrectionRequest);
  }

  async findAll(filter?: CorrectionFilter) {
    const where: Prisma.CorrectionRequestWhereInput = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.assetId) {
      where.assetId = filter.assetId;
    }

    const records = await this.db.correctionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return records.map(toDomainCorrectionRequest);
  }

  async save(correction: CorrectionRequest) {
    const data = toPrismaCorrectionRequest(correction);
    await this.db.correctionRequest.upsert({
      where: { id: correction.id },
      create: data,
      update: data,
    });
  }

  async delete(id: string) {
    await this.db.correctionRequest.delete({ where: { id } });
  }
}
