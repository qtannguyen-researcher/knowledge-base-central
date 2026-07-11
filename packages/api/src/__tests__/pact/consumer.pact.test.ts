import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import path from 'node:path';
import { PactV3 } from '@pact-foundation/pact';
import {
  willLogin,
  willRefreshToken,
  willLogout,
  willGetUsers,
  willCreateUser,
  willGetUserById,
  willUpdateUser,
  willDeleteUser,
  willGetRoles,
  willCreateRole,
  willGetRoleById,
  willUpdateRole,
  willDeleteRole,
  willGetPermissions,
  willCreatePermission,
  willGetPermissionById,
  willUpdatePermission,
  willDeletePermission,
  willGetUserRoles,
  willGetUserPermissions,
  willAuthorize,
  willGetAuditEvents,
  willCreateAuditEvent,
  willAssignRolePermission,
  willRemoveRolePermission,
} from '@identity-service/contracts';

const PROVIDER_NAME = 'Identity Service';
const CONSUMER_NAME = 'Knowledge Base Monolith';

describe('Identity Service Consumer Contract Tests', () => {
  let pact: PactV3;

  beforeAll(() => {
    pact = new PactV3({
      consumer: CONSUMER_NAME,
      provider: PROVIDER_NAME,
      dir: path.resolve(__dirname, '../../../pacts'),
      logLevel: 'warn',
    });
  });

  afterAll(async () => {
    await pact.writePact();
  });

  beforeEach(() => {
    pact.removeInteractions();
  });

  describe('Authentication API', () => {
    describe('POST /auth/login', () => {
      it('returns tokens and user on successful login', async () => {
        await pact.addInteraction(
          willLogin({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user with email test@example.com exists and is active',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.login('test@example.com', 'password123');

        expect(result).toBeDefined();
        expect((result as { accessToken: string }).accessToken).toBe('access-token-123');
      });
    });

    describe('POST /auth/refresh', () => {
      it('returns new tokens on valid refresh token', async () => {
        await pact.addInteraction(
          willRefreshToken({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'valid refresh token exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.refreshToken('valid-refresh-token');

        expect(result).toBeDefined();
        expect((result as { accessToken: string }).accessToken).toBe('new-access-token-123');
      });
    });

    describe('POST /auth/logout', () => {
      it('returns 204 on successful logout', async () => {
        await pact.addInteraction(
          willLogout({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'session is active',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.logout('refresh-token');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('User Management API', () => {
    describe('GET /users', () => {
      it('returns paginated list of users', async () => {
        await pact.addInteraction(
          willGetUsers({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'users exist',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getUsers();

        expect(result).toBeDefined();
        expect(Array.isArray(result as unknown[])).toBe(true);
      });
    });

    describe('POST /users', () => {
      it('creates a new user and returns 201', async () => {
        await pact.addInteraction(
          willCreateUser({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'no user with email new@example.com exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.createUser({
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
        });

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('user-123');
      });
    });

    describe('GET /users/:id', () => {
      it('returns user by id', async () => {
        await pact.addInteraction(
          willGetUserById({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user with id user-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getUserById('user-123');

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('user-123');
      });
    });

    describe('PUT /users/:id', () => {
      it('updates user and returns updated user', async () => {
        await pact.addInteraction(
          willUpdateUser({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user with id user-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.updateUser('user-123', {
          email: 'updated@example.com',
        });

        expect(result).toBeDefined();
        expect((result as { email: string }).email).toBe('updated@example.com');
      });
    });

    describe('DELETE /users/:id', () => {
      it('deletes user and returns 204', async () => {
        await pact.addInteraction(
          willDeleteUser({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user with id user-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.deleteUser('user-123');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Role Management API', () => {
    describe('GET /roles', () => {
      it('returns list of roles', async () => {
        await pact.addInteraction(
          willGetRoles({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'roles exist',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getRoles();

        expect(result).toBeDefined();
        expect(Array.isArray(result as unknown[])).toBe(true);
      });
    });

    describe('POST /roles', () => {
      it('creates a new role', async () => {
        await pact.addInteraction(
          willCreateRole({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'no role with name EDITOR exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.createRole({ name: 'EDITOR' });

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('role-456');
      });
    });

    describe('GET /roles/:id', () => {
      it('returns role by id', async () => {
        await pact.addInteraction(
          willGetRoleById({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'role with id role-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getRoleById('role-123');

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('role-123');
      });
    });

    describe('PUT /roles/:id', () => {
      it('updates role', async () => {
        await pact.addInteraction(
          willUpdateRole({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'role with id role-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.updateRole('role-123', {
          description: 'Updated description',
        });

        expect(result).toBeDefined();
      });
    });

    describe('DELETE /roles/:id', () => {
      it('deletes role and returns 204', async () => {
        await pact.addInteraction(
          willDeleteRole({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'role with id role-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.deleteRole('role-123');

        expect(result).toBeUndefined();
      });
    });

    describe('POST /roles/:roleId/permissions', () => {
      it('assigns permission to role', async () => {
        await pact.addInteraction(
          willAssignRolePermission({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'role and permission exist',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.assignRolePermission('role-123', 'perm-123');

        expect(result).toBeUndefined();
      });
    });

    describe('DELETE /roles/:roleId/permissions/:permissionId', () => {
      it('removes permission from role', async () => {
        await pact.addInteraction(
          willRemoveRolePermission({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'permission is assigned to role',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.removeRolePermission('role-123', 'perm-123');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Permission Management API', () => {
    describe('GET /permissions', () => {
      it('returns list of permissions', async () => {
        await pact.addInteraction(
          willGetPermissions({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'permissions exist',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getPermissions();

        expect(result).toBeDefined();
        expect(Array.isArray(result as unknown[])).toBe(true);
      });
    });

    describe('POST /permissions', () => {
      it('creates a new permission', async () => {
        await pact.addInteraction(
          willCreatePermission({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'no permission with name article:create exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.createPermission({ name: 'article:create' });

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('perm-456');
      });
    });

    describe('GET /permissions/:id', () => {
      it('returns permission by id', async () => {
        await pact.addInteraction(
          willGetPermissionById({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'permission with id perm-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getPermissionById('perm-123');

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('perm-123');
      });
    });

    describe('PUT /permissions/:id', () => {
      it('updates permission', async () => {
        await pact.addInteraction(
          willUpdatePermission({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'permission with id perm-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.updatePermission('perm-123', {
          description: 'Updated description',
        });

        expect(result).toBeDefined();
      });
    });

    describe('DELETE /permissions/:id', () => {
      it('deletes permission and returns 204', async () => {
        await pact.addInteraction(
          willDeletePermission({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'permission with id perm-123 exists',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.deletePermission('perm-123');

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Authorization API', () => {
    describe('GET /users/:userId/roles', () => {
      it('returns roles for user', async () => {
        await pact.addInteraction(
          willGetUserRoles({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user has roles assigned',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getUserRoles('user-123');

        expect(result).toBeDefined();
        expect(Array.isArray(result as unknown[])).toBe(true);
      });
    });

    describe('GET /users/:userId/permissions', () => {
      it('returns permissions for user', async () => {
        await pact.addInteraction(
          willGetUserPermissions({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user has permissions assigned',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getUserPermissions('user-123');

        expect(result).toBeDefined();
        expect(Array.isArray(result as unknown[])).toBe(true);
      });
    });

    describe('POST /authorize', () => {
      it('returns authorization decision', async () => {
        await pact.addInteraction(
          willAuthorize({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'user has required permission',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.authorize({
          userId: 'user-123',
          resourceId: 'asset-456',
          requiredPermission: 'article:view',
        });

        expect(result).toBeDefined();
        expect((result as { allowed: boolean }).allowed).toBe(true);
      });
    });
  });

  describe('Audit API', () => {
    describe('GET /audit-events', () => {
      it('returns paginated audit events', async () => {
        await pact.addInteraction(
          willGetAuditEvents({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'audit events exist',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.getAuditEvents();

        expect(result).toBeDefined();
        expect(Array.isArray(result as unknown[])).toBe(true);
      });
    });

    describe('POST /audit-events', () => {
      it('creates audit event', async () => {
        await pact.addInteraction(
          willCreateAuditEvent({
            provider: PROVIDER_NAME,
            consumer: CONSUMER_NAME,
            state: 'identity service is running',
          }),
        );

        const { IdentityServiceClient } = await import('@identity-service/contracts');
        const client = new IdentityServiceClient({
          baseUrl: pact.mockServer.url,
          timeoutMs: 5000,
        });

        const result = await client.createAuditEvent({
          action: 'user.login',
          resource: 'session',
        });

        expect(result).toBeDefined();
        expect((result as { id: string }).id).toBe('audit-456');
      });
    });
  });
});
