import type { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '@knowledge-base-central/shared';

import { User } from '../../domain/user/User.js';

const ROLE_MAP: Record<PrismaUserRole, UserRole> = {
  OWNER: UserRole.OWNER,
  ADMIN: UserRole.ADMIN,
  EDITOR: UserRole.EDITOR,
  CONTRIBUTOR: UserRole.CONTRIBUTOR,
};

const ROLE_TO_PRISMA: Record<UserRole, PrismaUserRole> = {
  [UserRole.OWNER]: 'OWNER',
  [UserRole.ADMIN]: 'ADMIN',
  [UserRole.EDITOR]: 'EDITOR',
  [UserRole.CONTRIBUTOR]: 'CONTRIBUTOR',
};

export function toDomainUser(record: PrismaUser): User {
  return new User({
    id: record.id,
    email: record.email,
    username: record.username,
    displayName: record.displayName,
    passwordHash: record.passwordHash,
    role: ROLE_MAP[record.role],
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function toPrismaUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    passwordHash: user.passwordHash,
    role: ROLE_TO_PRISMA[user.role],
    status: user.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
