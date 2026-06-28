import { UserRole } from '@knowledge-base-central/shared';
import { describe, expect, it } from 'vitest';

import { ROLE_PERMISSIONS, roleHasPermission } from '../rbac.js';

describe('rbac', () => {
  it('grants all permissions to OWNER via wildcard', () => {
    expect(ROLE_PERMISSIONS[UserRole.OWNER]).toEqual(['*']);
    expect(roleHasPermission(UserRole.OWNER, 'article:publish')).toBe(true);
    expect(roleHasPermission(UserRole.OWNER, 'system:manage')).toBe(true);
  });

  it('denies article:publish for CONTRIBUTOR', () => {
    expect(roleHasPermission(UserRole.CONTRIBUTOR, 'article:publish')).toBe(false);
  });

  it('allows article:publish for ADMIN', () => {
    expect(roleHasPermission(UserRole.ADMIN, 'article:publish')).toBe(true);
  });
});
