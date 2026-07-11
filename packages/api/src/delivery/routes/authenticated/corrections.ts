import type { ZodFastify } from '../../types.js';

import type { Container } from '../../../container.js';
import { UserRole } from '@knowledge-base-central/shared';
import { requireAuth } from '../../../auth.js';
import { slugParamSchema, paginationQuerySchema } from '../../schemas/common.js';
import { createCorrectionBodySchema } from '../../schemas/community.js';
import { sanitizeText } from '../../../infrastructure/sanitization/textSanitizer.js';

const CORRECTION_RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;
const CORRECTION_RATE_LIMIT_MAX = 5;

export async function registerAuthenticatedCorrectionRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.post(
    '/assets/:slug/corrections',
    {
      schema: {
        params: slugParamSchema,
        body: createCorrectionBodySchema,
      },
      preHandler: requireAuth(container),
    },
    async (request, reply) => {
      const { slug } = request.params;
      const { description, suggestion } = request.body;
      const userId = request.user!.id;

      const asset = await container.knowledgeAssetRepository.findBySlug(slug);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const windowStart = new Date(Date.now() - CORRECTION_RATE_LIMIT_WINDOW);
      const count = await container.prisma.correctionRequest.count({
        where: {
          submittedBy: userId,
          createdAt: { gte: windowStart },
        },
      });

      if (count >= CORRECTION_RATE_LIMIT_MAX) {
        return reply.status(429).send({
          error: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Maximum ${CORRECTION_RATE_LIMIT_MAX} correction requests per day.`,
        });
      }

      const sanitizedDescription = sanitizeText(description);
      const sanitizedSuggestion = suggestion ? sanitizeText(suggestion) : undefined;

      const { CorrectionRequest } = await import('../../../domain/community/CorrectionRequest.js');
      const correction = CorrectionRequest.create({
        assetId: asset.id,
        submittedBy: userId,
        description: sanitizedDescription,
        suggestion: sanitizedSuggestion,
      });

      await container.correctionRepository.save(correction);

      const admins = await container.prisma.user.findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.OWNER] } },
        select: { id: true },
      });

      for (const admin of admins) {
        await container.notificationService.send(admin.id, 'new_correction', {
          correctionId: correction.id,
          assetSlug: slug,
          submittedBy: userId,
        });
      }

      return reply.status(201).send({
        id: correction.id,
        status: correction.status,
      });
    },
  );

  app.get(
    '/users/me/corrections',
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

      const [corrections, total] = await Promise.all([
        container.prisma.correctionRequest.findMany({
          where: { submittedBy: userId },
          include: {
            asset: {
              select: { id: true, slug: true, title: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        container.prisma.correctionRequest.count({ where: { submittedBy: userId } }),
      ]);

      return {
        items: corrections.map((c) => ({
          id: c.id,
          description: c.description,
          suggestion: c.suggestion,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
          asset: c.asset,
        })),
        total,
        page,
        limit,
      };
    },
  );
}
