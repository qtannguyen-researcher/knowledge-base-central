import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { listAuditQuerySchema } from '../../schemas/audit.js';

export async function registerAdminAuditRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/audit',
    {
      preHandler: requirePermission('audit:view', container),
      schema: { querystring: listAuditQuerySchema },
    },
    async (request) => {
      const { page, limit } = request.query;
      const result = await container.auditService.findAll(page, limit);
      return {
        items: result.items.map((item) => ({
          id: item.id,
          actorId: item.actorId,
          actor: item.actor,
          action: item.action,
          resource: item.resource,
          resourceId: item.resourceId,
          payload: item.payload,
          createdAt: item.createdAt.toISOString(),
        })),
        total: result.total,
        page: result.page,
        limit: result.pageSize,
      };
    },
  );
}
