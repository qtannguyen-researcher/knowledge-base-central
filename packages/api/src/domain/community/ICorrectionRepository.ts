import { CorrectionStatus } from '@knowledge-base-central/shared';

import { CorrectionRequest } from './CorrectionRequest.js';

export interface CorrectionFilter {
  status?: CorrectionStatus;
  assetId?: string;
}

export interface ICorrectionRepository {
  findById(id: string): Promise<CorrectionRequest | null>;
  findByAsset(assetId: string, filter?: CorrectionFilter): Promise<CorrectionRequest[]>;
  findBySubmitter(submitterId: string): Promise<CorrectionRequest[]>;
  findAll(filter?: CorrectionFilter): Promise<CorrectionRequest[]>;
  save(correction: CorrectionRequest): Promise<void>;
  delete(id: string): Promise<void>;
}
