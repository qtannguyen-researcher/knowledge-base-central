import { RelationshipType } from '@knowledge-base-central/shared';

export interface RelationshipProps {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship: RelationshipType;
  status: string;
  createdById?: string | null;
  createdAt?: Date;
}

export class Relationship {
  readonly id: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly relationship: RelationshipType;
  readonly status: string;
  readonly createdById: string | null;
  readonly createdAt: Date;

  constructor(props: RelationshipProps) {
    this.id = props.id;
    this.sourceType = props.sourceType;
    this.sourceId = props.sourceId;
    this.targetType = props.targetType;
    this.targetId = props.targetId;
    this.relationship = props.relationship;
    this.status = props.status;
    this.createdById = props.createdById ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  toProps(): RelationshipProps {
    return {
      id: this.id,
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      targetType: this.targetType,
      targetId: this.targetId,
      relationship: this.relationship,
      status: this.status,
      createdById: this.createdById,
      createdAt: this.createdAt,
    };
  }
}
