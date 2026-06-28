export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  CONTRIBUTOR: 'CONTRIBUTOR',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
