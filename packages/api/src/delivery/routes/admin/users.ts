import type { ZodFastify } from '../../types.js';
import { z } from 'zod';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { idParamSchema } from '../../schemas/common.js';
import { UserRole } from '@knowledge-base-central/shared';

const updateRoleBodySchema = z.object({ role: z.nativeEnum(UserRole) });
const updateStatusBodySchema = z.object({ status: z.string() });

export async function registerAdminUserRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get('/users', { preHandler: requirePermission('user:view', container) }, async () => {
    const users = await container.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));
  });

  app.put(
    '/users/:id/role',
    {
      preHandler: requirePermission('user:update', container),
      schema: { params: idParamSchema, body: updateRoleBodySchema },
    },
    async (request, reply) => {
      try {
        const user = await container.prisma.user.update({
          where: { id: request.params.id },
          data: { role: request.body.role },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true,
            status: true,
            createdAt: true,
          },
        });
        return { ...user, createdAt: user.createdAt.toISOString() };
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );

  app.put(
    '/users/:id/status',
    {
      preHandler: requirePermission('user:update', container),
      schema: { params: idParamSchema, body: updateStatusBodySchema },
    },
    async (request, reply) => {
      try {
        const user = await container.prisma.user.update({
          where: { id: request.params.id },
          data: { status: request.body.status },
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true,
            status: true,
            createdAt: true,
          },
        });
        return { ...user, createdAt: user.createdAt.toISOString() };
      } catch {
        return reply.status(404).send({ error: 'not_found' });
      }
    },
  );
}
