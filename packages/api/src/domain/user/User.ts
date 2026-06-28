import { UserRole } from '@knowledge-base-central/shared';

export interface UserProps {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  passwordHash?: string | null;
  role: UserRole;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ALL_PERMISSIONS = [
  'article:view',
  'article:create',
  'article:update',
  'article:delete',
  'article:publish',
  'article:archive',
  'article:restore',
  'concept:view',
  'concept:create',
  'concept:update',
  'concept:delete',
  'category:view',
  'category:create',
  'category:update',
  'category:delete',
  'tag:view',
  'tag:create',
  'tag:update',
  'tag:delete',
  'reference:view',
  'reference:create',
  'reference:update',
  'reference:delete',
  'learning-path:view',
  'learning-path:create',
  'learning-path:update',
  'learning-path:delete',
  'comment:view',
  'comment:create',
  'comment:update',
  'comment:delete',
  'comment:moderate',
  'correction:view',
  'correction:create',
  'correction:update',
  'correction:approve',
  'correction:reject',
  'attachment:view',
  'attachment:create',
  'attachment:update',
  'attachment:delete',
  'user:view',
  'user:create',
  'user:update',
  'user:delete',
  'user:assign-role',
  'audit:view',
  'repository:view',
  'repository:sync',
  'repository:manage',
  'system:view',
  'system:update',
  'system:manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.CONTRIBUTOR]: [
    'article:view',
    'concept:view',
    'category:view',
    'tag:view',
    'reference:view',
    'learning-path:view',
    'comment:view',
    'comment:create',
    'correction:create',
  ],
  [UserRole.EDITOR]: [
    'article:view',
    'article:create',
    'article:update',
    'concept:view',
    'concept:create',
    'concept:update',
    'category:view',
    'tag:view',
    'reference:view',
    'reference:create',
    'reference:update',
    'learning-path:view',
    'learning-path:create',
    'learning-path:update',
    'attachment:create',
    'attachment:update',
    'comment:view',
    'correction:view',
  ],
  [UserRole.ADMIN]: [
    'article:view',
    'article:create',
    'article:update',
    'article:delete',
    'article:publish',
    'article:archive',
    'article:restore',
    'concept:view',
    'concept:create',
    'concept:update',
    'concept:delete',
    'category:view',
    'category:create',
    'category:update',
    'category:delete',
    'tag:view',
    'tag:create',
    'tag:update',
    'tag:delete',
    'reference:view',
    'reference:create',
    'reference:update',
    'reference:delete',
    'learning-path:view',
    'learning-path:create',
    'learning-path:update',
    'learning-path:delete',
    'attachment:create',
    'attachment:update',
    'attachment:delete',
    'comment:view',
    'comment:moderate',
    'correction:view',
    'correction:approve',
    'correction:reject',
    'user:view',
    'audit:view',
    'repository:view',
    'repository:sync',
  ],
  [UserRole.OWNER]: ALL_PERMISSIONS,
};

export class User {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly displayName: string | null;
  readonly passwordHash: string | null;
  readonly role: UserRole;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.username = props.username;
    this.displayName = props.displayName ?? null;
    this.passwordHash = props.passwordHash ?? null;
    this.role = props.role;
    this.status = props.status;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  hasPermission(permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[this.role];
    return permissions.includes(permission as Permission);
  }

  static allPermissions(): readonly Permission[] {
    return ALL_PERMISSIONS;
  }

  static permissionsForRole(role: UserRole): readonly Permission[] {
    return ROLE_PERMISSIONS[role];
  }
}
