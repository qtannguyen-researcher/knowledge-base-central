import { v4 as uuidv4 } from 'uuid';

import { CorrectionStatus } from '@knowledge-base-central/shared';

export interface CorrectionRequestProps {
  id: string;
  assetId: string;
  submittedBy: string;
  description: string;
  suggestion?: string | null;
  status: CorrectionStatus;
  reviewedById?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCorrectionRequestProps {
  assetId: string;
  submittedBy: string;
  description: string;
  suggestion?: string;
}

const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_SUGGESTION_LENGTH = 2000;

const VALID_TRANSITIONS: Record<CorrectionStatus, CorrectionStatus[]> = {
  [CorrectionStatus.SUBMITTED]: [CorrectionStatus.UNDER_REVIEW],
  [CorrectionStatus.UNDER_REVIEW]: [CorrectionStatus.ACCEPTED, CorrectionStatus.REJECTED],
  [CorrectionStatus.ACCEPTED]: [CorrectionStatus.IMPLEMENTED],
  [CorrectionStatus.REJECTED]: [],
  [CorrectionStatus.IMPLEMENTED]: [],
};

export class CorrectionRequest {
  readonly id: string;
  readonly assetId: string;
  readonly submittedBy: string;
  private _description: string;
  private _suggestion: string | null;
  private _status: CorrectionStatus;
  private _reviewedById: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CorrectionRequestProps) {
    this.id = props.id;
    this.assetId = props.assetId;
    this.submittedBy = props.submittedBy;
    this._description = props.description;
    this._suggestion = props.suggestion ?? null;
    this._status = props.status;
    this._reviewedById = props.reviewedById ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: CreateCorrectionRequestProps): CorrectionRequest {
    const description = props.description.trim();
    if (description.length === 0) {
      throw new Error('Description cannot be empty');
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    let suggestion: string | null = null;
    if (props.suggestion) {
      suggestion = props.suggestion.trim();
      if (suggestion.length > MAX_SUGGESTION_LENGTH) {
        throw new Error(`Suggestion cannot exceed ${MAX_SUGGESTION_LENGTH} characters`);
      }
    }

    return new CorrectionRequest({
      id: uuidv4(),
      assetId: props.assetId,
      submittedBy: props.submittedBy,
      description,
      suggestion,
      status: CorrectionStatus.SUBMITTED,
      reviewedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: CorrectionRequestProps): CorrectionRequest {
    return new CorrectionRequest(props);
  }

  get description(): string {
    return this._description;
  }

  get suggestion(): string | null {
    return this._suggestion;
  }

  get status(): CorrectionStatus {
    return this._status;
  }

  get reviewedById(): string | null {
    return this._reviewedById;
  }

  private canTransitionTo(newStatus: CorrectionStatus): boolean {
    return VALID_TRANSITIONS[this._status]?.includes(newStatus) ?? false;
  }

  markUnderReview(reviewerId: string): void {
    if (!this.canTransitionTo(CorrectionStatus.UNDER_REVIEW)) {
      throw new Error(`Cannot transition from ${this._status} to UNDER_REVIEW`);
    }
    this._status = CorrectionStatus.UNDER_REVIEW;
    this._reviewedById = reviewerId;
    this.updatedAt = new Date();
  }

  accept(reviewerId: string): void {
    if (!this.canTransitionTo(CorrectionStatus.ACCEPTED)) {
      throw new Error(`Cannot transition from ${this._status} to ACCEPTED`);
    }
    this._status = CorrectionStatus.ACCEPTED;
    this._reviewedById = reviewerId;
    this.updatedAt = new Date();
  }

  reject(reviewerId: string): void {
    if (!this.canTransitionTo(CorrectionStatus.REJECTED)) {
      throw new Error(`Cannot transition from ${this._status} to REJECTED`);
    }
    this._status = CorrectionStatus.REJECTED;
    this._reviewedById = reviewerId;
    this.updatedAt = new Date();
  }

  markImplemented(reviewerId: string): void {
    if (!this.canTransitionTo(CorrectionStatus.IMPLEMENTED)) {
      throw new Error(`Cannot transition from ${this._status} to IMPLEMENTED`);
    }
    this._status = CorrectionStatus.IMPLEMENTED;
    this._reviewedById = reviewerId;
    this.updatedAt = new Date();
  }

  toProps(): CorrectionRequestProps {
    return {
      id: this.id,
      assetId: this.assetId,
      submittedBy: this.submittedBy,
      description: this._description,
      suggestion: this._suggestion,
      status: this._status,
      reviewedById: this._reviewedById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
