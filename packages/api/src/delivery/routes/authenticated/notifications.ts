import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { requireAuth } from '../../../auth.js';
import { paginationQuerySchema, notificationIdParamSchema } from '../../schemas/community.js';

export async function registerUserNotificationRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/users/me/notifications',
    {
      schema: {
        querystring: paginationQuerySchema,
      },
      preHandler: requireAuth(container),
    },
    async (request, _reply) => {
      const userId = request.user!.id;
      const { page = 1, limit = 20 } = request.query;
      const skip = (page - 1) * limit;

      const notifications = await container.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      const total = await container.prisma.notification.count({ where: { userId } });

      return {
        items: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          payload: n.payload,
          status: n.status,
          createdAt: n.createdAt.toISOString(),
          sentAt: n.sentAt?.toISOString() || null,
        })),
        total,
        page,
        limit,
      };
    },
  );

  app.post(
    '/users/me/notifications/:id/read',
    {
      schema: { params: notificationIdParamSchema },
      preHandler: requireAuth(container),
    },
    async (request, _reply) => {
      const { id } = request.params;
      const userId = request.user!.id;

      const notification = await container.prisma.notification.findUnique({
        where: { id },
      });

      if (!notification || notification.userId !== userId) {
        return reply.status(404).send({ error: 'not_found' });
      }

      return reply.status(200).send({ success: true });
    },
  );

  app.post(
    '/users/me/notifications/read-all',
    {
      preHandler: requireAuth(container),
    },
    async (request, _reply) => {
      const userId = request.user!.id;

      await container.prisma.notification.updateMany({
        where: { userId },
        data: { sentAt: new Date() },
      });

      return reply.status(200).send({ success: true });
    },
  );
}
