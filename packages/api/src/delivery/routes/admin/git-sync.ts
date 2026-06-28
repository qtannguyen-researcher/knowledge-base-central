import type { ZodFastify } from '../../types.js';
import { z } from 'zod';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { enqueueGitSyncJob } from '../../../infrastructure/queue/QueueClient.js';

const triggerSyncBodySchema = z.object({
  repository: z.string().url().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const jobIdParamSchema = z.object({
  id: z.string().uuid(),
});

export async function registerAdminGitSyncRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  // POST /api/v1/admin/git-sync/trigger - Trigger a manual sync
  app.post(
    '/git-sync/trigger',
    {
      preHandler: requirePermission('repository:sync', container),
      schema: { body: triggerSyncBodySchema },
    },
    async (request, reply) => {
      const jobId = crypto.randomUUID();
      const repository = request.body?.repository || process.env.GIT_REPO_URL || 'local';

      await enqueueGitSyncJob({
        jobId,
        trigger: 'MANUAL',
        repository,
      });

      return reply.status(202).send({ jobId });
    },
  );

  // GET /api/v1/admin/git-sync/jobs - List sync jobs
  app.get(
    '/git-sync/jobs',
    {
      preHandler: requirePermission('repository:sync', container),
      schema: {
        querystring: paginationSchema,
      },
    },
    async (request, _reply) => {
      const { page, limit } = request.query;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        container.prisma.gitSyncJob.findMany({
          skip,
          take: limit,
          orderBy: { startedAt: 'desc' },
        }),
        container.prisma.gitSyncJob.count(),
      ]);

      return {
        items,
        total,
        page,
        pageSize: limit,
      };
    },
  );

  // GET /api/v1/admin/git-sync/jobs/:id - Get job detail
  app.get(
    '/git-sync/jobs/:id',
    {
      preHandler: requirePermission('repository:sync', container),
      schema: {
        params: jobIdParamSchema,
      },
    },
    async (request, reply) => {
      const job = await container.prisma.gitSyncJob.findUnique({
        where: { id: request.params.id },
      });

      if (!job) {
        return reply.status(404).send({ error: 'not_found' });
      }

      return job;
    },
  );
}
