import { Interaction } from '@pact-foundation/pact';
import type { User } from '../index.js';

export interface PactIdentityInteractionOptions {
  provider: string;
  consumer?: string;
  state?: string;
}

type PactInteractionBuilder = (options: PactIdentityInteractionOptions) => Interaction;

const buildUserResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildUsersListResponse = (users: User[]) => ({
  data: users.map((user) => buildUserResponse(user)),
  pagination: {
    page: 1,
    pageSize: users.length,
    total: users.length,
  },
});

export const willGetUsers: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /users')
    .withRequest({
      method: 'GET',
      path: '/users',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: buildUsersListResponse([]),
    });
  return interaction;
};

export const willCreateUser: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /users')
    .withRequest({
      method: 'POST',
      path: '/users',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'correlation-123',
      },
      body: {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'USER',
      },
    })
    .willRespondWith({
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'user-123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};

export const willGetUserById: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /users/user-123')
    .withRequest({
      method: 'GET',
      path: '/users/user-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: buildUserResponse({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }),
    });
  return interaction;
};

export const willUpdateUser: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a PUT request to /users/user-123')
    .withRequest({
      method: 'PUT',
      path: '/users/user-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: buildUserResponse({
        id: 'user-123',
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T01:00:00.000Z',
      }),
    });
  return interaction;
};

export const willDeleteUser: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a DELETE request to /users/user-123')
    .withRequest({
      method: 'DELETE',
      path: '/users/user-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 204,
    });
  return interaction;
};

export const willLogin: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /auth/login')
    .withRequest({
      method: 'POST',
      path: '/auth/login',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresIn: 900,
        user: buildUserResponse({
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }),
      },
    });
  return interaction;
};

export const willRefreshToken: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /auth/refresh')
    .withRequest({
      method: 'POST',
      path: '/auth/refresh',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123',
        expiresIn: 900,
        user: buildUserResponse({
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        }),
      },
    });
  return interaction;
};

export const willLogout: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /auth/logout')
    .withRequest({
      method: 'POST',
      path: '/auth/logout',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 204,
    });
  return interaction;
};

export const willGetRoles: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /roles')
    .withRequest({
      method: 'GET',
      path: '/roles',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        data: [
          {
            id: 'role-123',
            name: 'USER',
            description: 'Standard user role',
            permissions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  return interaction;
};

export const willCreateRole: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /roles')
    .withRequest({
      method: 'POST',
      path: '/roles',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'role-456',
        name: 'EDITOR',
        description: 'Editor role',
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};

export const willGetRoleById: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /roles/role-123')
    .withRequest({
      method: 'GET',
      path: '/roles/role-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'role-123',
        name: 'USER',
        description: 'Standard user role',
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};

export const willUpdateRole: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a PUT request to /roles/role-123')
    .withRequest({
      method: 'PUT',
      path: '/roles/role-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'role-123',
        name: 'USER',
        description: 'Updated description',
        permissions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T01:00:00.000Z',
      },
    });
  return interaction;
};

export const willDeleteRole: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a DELETE request to /roles/role-123')
    .withRequest({
      method: 'DELETE',
      path: '/roles/role-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 204,
    });
  return interaction;
};

export const willGetPermissions: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /permissions')
    .withRequest({
      method: 'GET',
      path: '/permissions',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        data: [
          {
            id: 'perm-123',
            name: 'article:view',
            description: 'View articles',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  return interaction;
};

export const willCreatePermission: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /permissions')
    .withRequest({
      method: 'POST',
      path: '/permissions',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'perm-456',
        name: 'article:create',
        description: 'Create articles',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};

export const willGetPermissionById: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /permissions/perm-123')
    .withRequest({
      method: 'GET',
      path: '/permissions/perm-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'perm-123',
        name: 'article:view',
        description: 'View articles',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};

export const willUpdatePermission: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a PUT request to /permissions/perm-123')
    .withRequest({
      method: 'PUT',
      path: '/permissions/perm-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'perm-123',
        name: 'article:view',
        description: 'Updated description',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};

export const willDeletePermission: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a DELETE request to /permissions/perm-123')
    .withRequest({
      method: 'DELETE',
      path: '/permissions/perm-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 204,
    });
  return interaction;
};

export const willAssignRolePermission: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /roles/role-123/permissions')
    .withRequest({
      method: 'POST',
      path: '/roles/role-123/permissions',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 201,
    });
  return interaction;
};

export const willRemoveRolePermission: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a DELETE request to /roles/role-123/permissions/perm-123')
    .withRequest({
      method: 'DELETE',
      path: '/roles/role-123/permissions/perm-123',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 204,
    });
  return interaction;
};

export const willGetUserRoles: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /users/user-123/roles')
    .withRequest({
      method: 'GET',
      path: '/users/user-123/roles',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        data: [
          {
            id: 'role-123',
            name: 'USER',
            description: 'Standard user role',
            permissions: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  return interaction;
};

export const willGetUserPermissions: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /users/user-123/permissions')
    .withRequest({
      method: 'GET',
      path: '/users/user-123/permissions',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        data: [
          {
            id: 'perm-123',
            name: 'article:view',
            description: 'View articles',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  return interaction;
};

export const willAuthorize: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /authorize')
    .withRequest({
      method: 'POST',
      path: '/authorize',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        allowed: true,
      },
    });
  return interaction;
};

export const willGetAuditEvents: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a GET request to /audit-events')
    .withRequest({
      method: 'GET',
      path: '/audit-events',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        data: [
          {
            id: 'audit-123',
            action: 'user.created',
            resource: 'user',
            resourceId: 'user-123',
            actorId: 'user-123',
            payload: null,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    });
  return interaction;
};

export const willCreateAuditEvent: PactInteractionBuilder = (options) => {
  const interaction = new Interaction()
    .given(options.state ?? 'identity service is running')
    .uponReceiving('a POST request to /audit-events')
    .withRequest({
      method: 'POST',
      path: '/audit-events',
      headers: { 'Content-Type': 'application/json' },
    })
    .willRespondWith({
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: 'audit-456',
        action: 'user.login',
        resource: 'session',
        resourceId: 'session-123',
        actorId: 'user-123',
        payload: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });
  return interaction;
};
