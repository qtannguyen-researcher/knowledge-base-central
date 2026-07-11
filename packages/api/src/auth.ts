import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import type { Container } from './container.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  sessionId: string;
  role: string;
  permissions: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

function extractUserFromToken(token: string, publicKey: string): AuthenticatedUser {
  const payload = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
  }) as {
    sub: string;
    email: string;
    sid: string;
    role: string;
    permissions: string[];
  };

  return {
    id: payload.sub,
    email: payload.email,
    sessionId: payload.sid,
    role: payload.role,
    permissions: payload.permissions,
  };
}

export function requireAuth(container: Container) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const token = authHeader.slice(7);

    try {
      const user = extractUserFromToken(token, container.identityPublicKey);
      request.user = user;
    } catch {
      return reply.status(401).send({ error: 'invalid_token' });
    }
  };
}

export function requirePermission(container: Container, permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const token = authHeader.slice(7);

    let user: AuthenticatedUser;
    try {
      user = extractUserFromToken(token, container.identityPublicKey);
      request.user = user;
    } catch {
      return reply.status(401).send({ error: 'invalid_token' });
    }

    if (!hasPermission(user.role, permission, user.permissions)) {
      return reply.status(403).send({ error: 'forbidden' });
    }
  };
}

function hasPermission(role: string, permission: string, userPermissions: string[]): boolean {
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(permission)) return true;

  const rolePermissions: Record<string, string[]> = {
    ADMIN: [
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
      'search:manage',
    ],
    EDITOR: [
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
    USER: [
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
  };

  const permissions = rolePermissions[role] ?? [];
  return permissions.includes('*') || permissions.includes(permission);
}
