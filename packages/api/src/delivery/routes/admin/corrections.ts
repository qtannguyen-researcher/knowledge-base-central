import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import {
  commentIdParamSchema,
  listCorrectionsQuerySchema,
  correctionReviewBodySchema,
} from '../../schemas/community.js';
import { requirePermission } from '../../../auth/middleware.js';

export async function registerAdminCorrectionRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.get(
    '/corrections',
    {
      schema: {
        querystring: listCorrectionsQuerySchema,
      },
      preHandler: requirePermission('correction:view', container),
    },
    async (request, _reply) => {
      const { page = 1, limit = 20, status, assetId } = request.query;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (assetId) where.assetId = assetId;

      const [corrections, total] = await Promise.all([
        container.prisma.correctionRequest.findMany({
          where,
          include: {
            asset: { select: { id: true, slug: true, title: true } },
            submitter: { select: { id: true, username: true, displayName: true } },
            reviewedBy: { select: { id: true, username: true, displayName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        container.prisma.correctionRequest.count({ where }),
      ]);

      return {
        items: corrections.map((c) => ({
          id: c.id,
          description: c.description,
          suggestion: c.suggestion,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          asset: c.asset,
          submitter: c.submitter,
          reviewedBy: c.reviewedBy,
        })),
        total,
        page,
        limit,
      };
    },
  );

  app.get(
    '/corrections/:id',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission('correction:view', container),
    },
    async (request, _reply) => {
      const { id } = request.params;

      const correction = await container.correctionRepository.findById(id);
      if (!correction) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const full = await container.prisma.correctionRequest.findUnique({
        where: { id },
        include: {
          asset: { select: { id: true, slug: true, title: true } },
          submitter: { select: { id: true, username: true, displayName: true } },
          reviewedBy: { select: { id: true, username: true, displayName: true } },
        },
      });

      return {
        id: full!.id,
        description: full!.description,
        suggestion: full!.suggestion,
        status: full!.status,
        createdAt: full!.createdAt.toISOString(),
        updatedAt: full!.updatedAt.toISOString(),
        asset: full!.asset,
        submitter: full!.submitter,
        reviewedBy: full!.reviewedBy,
      };
    },
  );

  app.post(
    '/corrections/:id/review',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission('correction:approve', container),
    },
    async (request, _reply) => {
      const { id } = request.params;
      const reviewerId = request.session.userId!;

      const correction = await container.correctionRepository.findById(id);
      if (!correction) {
        return reply.status(404).send({ error: 'not_found' });
      }

      try {
        correction.markUnderReview(reviewerId);
        await container.correctionRepository.save(correction);

        await container.notificationService.send(
          correction.submittedBy,
          'correction_under_review',
          {
            correctionId: correction.id,
            assetId: correction.assetId,
          },
        );

        return reply.status(200).send({ id: correction.id, status: correction.status });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    },
  );

  app.post(
    '/corrections/:id/accept',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission('correction:approve', container),
    },
    async (request, _reply) => {
      const { id } = request.params;
      const reviewerId = request.session.userId!;

      const correction = await container.correctionRepository.findById(id);
      if (!correction) {
        return reply.status(404).send({ error: 'not_found' });
      }

      try {
        correction.accept(reviewerId);
        await container.correctionRepository.save(correction);

        await container.notificationService.send(correction.submittedBy, 'correction_accepted', {
          correctionId: correction.id,
          assetId: correction.assetId,
        });

        return reply.status(200).send({ id: correction.id, status: correction.status });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    },
  );

  app.post(
    '/corrections/:id/reject',
    {
      schema: { params: commentIdParamSchema, body: correctionReviewBodySchema },
      preHandler: requirePermission('correction:reject', container),
    },
    async (request, _reply) => {
      const { id } = request.params;
      const { reason } = request.body || {};
      const reviewerId = request.session.userId!;

      const correction = await container.correctionRepository.findById(id);
      if (!correction) {
        return reply.status(404).send({ error: 'not_found' });
      }

      try {
        correction.reject(reviewerId);
        await container.correctionRepository.save(correction);

        await container.notificationService.send(correction.submittedBy, 'correction_rejected', {
          correctionId: correction.id,
          assetId: correction.assetId,
          reason,
        });

        return reply.status(200).send({ id: correction.id, status: correction.status });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    },
  );

  app.post(
    '/corrections/:id/implement',
    {
      schema: { params: commentIdParamSchema },
      preHandler: requirePermission('correction:approve', container),
    },
    async (request, _reply) => {
      const { id } = request.params;
      const reviewerId = request.session.userId!;

      const correction = await container.correctionRepository.findById(id);
      if (!correction) {
        return reply.status(404).send({ error: 'not_found' });
      }

      try {
        correction.markImplemented(reviewerId);
        await container.correctionRepository.save(correction);

        await container.notificationService.send(correction.submittedBy, 'correction_implemented', {
          correctionId: correction.id,
          assetId: correction.assetId,
        });

        return reply.status(200).send({ id: correction.id, status: correction.status });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    },
  );
}
