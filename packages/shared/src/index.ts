export { KnowledgeAssetStatus, ContentType, Difficulty } from './types/knowledge-asset.js';
export type {
  KnowledgeAssetStatus as KnowledgeAssetStatusType,
  ContentType as ContentTypeType,
  Difficulty as DifficultyType,
} from './types/knowledge-asset.js';

export { RelationshipType } from './types/relationship.js';
export type { RelationshipType as RelationshipTypeType } from './types/relationship.js';

export { UserRole } from './types/user.js';
export type { UserRole as UserRoleType } from './types/user.js';

export { CommentStatus, CorrectionStatus } from './types/community.js';
export type {
  CommentStatus as CommentStatusType,
  CorrectionStatus as CorrectionStatusType,
} from './types/community.js';

export { SyncStatus } from './types/sync.js';
export type { SyncStatus as SyncStatusType } from './types/sync.js';

// Identity Service user type (standardized across services)
export interface IdentityServiceUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}
