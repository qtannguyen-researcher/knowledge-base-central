import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';

import type { Container } from '../container.js';
import { roleHasPermission } from './rbac.js';

export function requireAuth(): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.session.userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }
  };
}

export function requirePermission(permission: string, container: Container): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.session.userId) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    const user = await container.userRepository.findById(request.session.userId);
    if (!user) {
      return reply.status(401).send({ error: 'unauthorized' });
    }

    if (!roleHasPermission(user.role, permission)) {
      return reply.status(403).send({ error: 'forbidden' });
    }
  };
}
