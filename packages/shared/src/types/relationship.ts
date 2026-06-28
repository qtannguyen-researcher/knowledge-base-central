export const RelationshipType = {
  DEPENDS_ON: 'DEPENDS_ON',
  RELATED_TO: 'RELATED_TO',
  USES: 'USES',
  EXTENDS: 'EXTENDS',
  REFERENCES: 'REFERENCES',
  CONTRASTS: 'CONTRASTS',
} as const;

export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];
