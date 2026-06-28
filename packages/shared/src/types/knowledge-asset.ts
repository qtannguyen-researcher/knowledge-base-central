export const KnowledgeAssetStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED',
} as const;

export type KnowledgeAssetStatus = (typeof KnowledgeAssetStatus)[keyof typeof KnowledgeAssetStatus];

export const ContentType = {
  CONCEPT: 'CONCEPT',
  TUTORIAL: 'TUTORIAL',
  RESEARCH_NOTE: 'RESEARCH_NOTE',
  REFERENCE_MATERIAL: 'REFERENCE_MATERIAL',
  LEARNING_NOTE: 'LEARNING_NOTE',
  ARCHITECTURE_NOTE: 'ARCHITECTURE_NOTE',
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const Difficulty = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
