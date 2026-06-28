import { UserRole } from '@knowledge-base-central/shared';
import { describe, expect, it } from 'vitest';

import { User } from '../User.js';

describe('User.hasPermission', () => {
  const roles = [UserRole.CONTRIBUTOR, UserRole.EDITOR, UserRole.ADMIN, UserRole.OWNER] as const;

  const allPermissions = User.allPermissions();

  const expectedMatrix: Record<(typeof roles)[number], Set<string>> = {
    [UserRole.CONTRIBUTOR]: new Set(User.permissionsForRole(UserRole.CONTRIBUTOR)),
    [UserRole.EDITOR]: new Set(User.permissionsForRole(UserRole.EDITOR)),
    [UserRole.ADMIN]: new Set(User.permissionsForRole(UserRole.ADMIN)),
    [UserRole.OWNER]: new Set(User.permissionsForRole(UserRole.OWNER)),
  };

  for (const role of roles) {
    describe(role, () => {
      const user = new User({
        id: 'user-1',
        email: `${role.toLowerCase()}@example.com`,
        username: role.toLowerCase(),
        role,
        status: 'ACTIVE',
      });

      for (const permission of allPermissions) {
        it(`${permission} => ${expectedMatrix[role].has(permission) ? 'granted' : 'denied'}`, () => {
          expect(user.hasPermission(permission)).toBe(expectedMatrix[role].has(permission));
        });
      }
    });
  }

  it('denies unknown permissions by default', () => {
    const user = new User({
      id: 'user-1',
      email: 'editor@example.com',
      username: 'editor',
      role: UserRole.EDITOR,
      status: 'ACTIVE',
    });

    expect(user.hasPermission('unknown:permission')).toBe(false);
  });
});
