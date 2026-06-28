import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import type { Container } from '../container.js';
import { registerAdminAssetRoutes } from './routes/admin/assets.js';
import { registerAdminAttachmentRoutes } from './routes/admin/attachments.js';
import { registerAdminAuditRoutes } from './routes/admin/audit.js';
import { registerAdminCategoryRoutes } from './routes/admin/categories.js';
import { registerAdminCommentRoutes } from './routes/admin/comments.js';
import { registerAdminConceptRoutes } from './routes/admin/concepts.js';
import { registerAdminCorrectionRoutes } from './routes/admin/corrections.js';
import { registerAdminGitSyncRoutes } from './routes/admin/git-sync.js';
import { registerAdminLearningPathRoutes } from './routes/admin/learning-paths.js';
import { registerAdminReferenceRoutes } from './routes/admin/references.js';
import { registerAdminRelationshipRoutes } from './routes/admin/relationships.js';
import { registerAdminSearchRoutes } from './routes/admin/search.js';
import { registerAdminTagRoutes } from './routes/admin/tags.js';
import { registerAdminUserRoutes } from './routes/admin/users.js';
import { registerPublicAssetRoutes } from './routes/public/assets.js';
import { registerPublicCategoryRoutes } from './routes/public/categories.js';
import { registerPublicCommentRoutes } from './routes/public/comments.js';
import { registerPublicConceptRoutes } from './routes/public/concepts.js';
import { registerPublicLearningPathRoutes } from './routes/public/learning-paths.js';
import { registerPublicReferenceRoutes } from './routes/public/references.js';
import { registerPublicSearchRoutes } from './routes/public/search.js';
import { registerPublicTagRoutes } from './routes/public/tags.js';
import { registerAuthenticatedCommentRoutes } from './routes/authenticated/comments.js';
import { registerAuthenticatedCorrectionRoutes } from './routes/authenticated/corrections.js';
import { registerUserNotificationRoutes } from './routes/authenticated/notifications.js';
import { registerWebhooks } from './routes/webhooks.js';

export interface DeliveryOptions {
  container: Container;
}

async function registerPublicRoutes(app: FastifyInstance, container: Container): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  await registerPublicAssetRoutes(typed, container);
  await registerPublicCategoryRoutes(typed, container);
  await registerPublicTagRoutes(typed, container);
  await registerPublicConceptRoutes(typed, container);
  await registerPublicReferenceRoutes(typed, container);
  await registerPublicLearningPathRoutes(typed, container);
  await registerPublicSearchRoutes(typed, container);
  await registerPublicCommentRoutes(typed, container);
}

async function registerAdminRoutes(app: FastifyInstance, container: Container): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  await registerAdminAssetRoutes(typed, container);
  await registerAdminCategoryRoutes(typed, container);
  await registerAdminTagRoutes(typed, container);
  await registerAdminConceptRoutes(typed, container);
  await registerAdminRelationshipRoutes(typed, container);
  await registerAdminReferenceRoutes(typed, container);
  await registerAdminAttachmentRoutes(typed, container);
  await registerAdminLearningPathRoutes(typed, container);
  await registerAdminUserRoutes(typed, container);
  await registerAdminAuditRoutes(typed, container);
  await registerAdminGitSyncRoutes(typed, container);
  await registerAdminCommentRoutes(typed, container);
  await registerAdminCorrectionRoutes(typed, container);
  await registerAdminSearchRoutes(typed, container);
}

async function registerAuthenticatedRoutes(
  app: FastifyInstance,
  container: Container,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  await registerAuthenticatedCommentRoutes(typed, container);
  await registerAuthenticatedCorrectionRoutes(typed, container);
  await registerUserNotificationRoutes(typed, container);
}

export async function registerDelivery(
  app: FastifyInstance,
  options: DeliveryOptions,
): Promise<void> {
  const { container } = options;

  await app.register(
    async (publicApp) => {
      await registerPublicRoutes(publicApp, container);
    },
    { prefix: '/api/v1' },
  );

  await app.register(
    async (authenticatedApp) => {
      await registerAuthenticatedRoutes(authenticatedApp, container);
    },
    { prefix: '/api/v1' },
  );

  await app.register(
    async (adminApp) => {
      await registerAdminRoutes(adminApp, container);
    },
    { prefix: '/api/v1/admin' },
  );

  await registerWebhooks(app, container);
}
