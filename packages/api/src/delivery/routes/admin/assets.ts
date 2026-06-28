import type { ZodFastify } from '../../types.js';

import { requirePermission } from '../../../auth/middleware.js';
import type { Container } from '../../../container.js';
import { KnowledgeAsset } from '../../../domain/knowledge-asset/KnowledgeAsset.js';
import { handleDomainError, slugify, toAssetJson } from '../../helpers.js';
import {
  adminListAssetsQuerySchema,
  createAssetBodySchema,
  linkConceptBodySchema,
  linkReferenceBodySchema,
  updateAssetBodySchema,
} from '../../schemas/asset.js';
import {
  conceptLinkParamSchema,
  idParamSchema,
  referenceLinkParamSchema,
  versionIdParamSchema,
} from '../../schemas/common.js';

async function linkTags(container: Container, assetId: string, tagSlugs: string[]): Promise<void> {
  for (const slug of tagSlugs) {
    const tag = await container.prisma.tag.upsert({
      where: { slug },
      create: { slug, name: slug },
      update: {},
    });
    await container.prisma.knowledgeAssetTag.upsert({
      where: { assetId_tagId: { assetId, tagId: tag.id } },
      create: { assetId, tagId: tag.id },
      update: {},
    });
  }
}

export async function registerAdminAssetRoutes(
  app: ZodFastify,
  container: Container,
): Promise<void> {
  app.post(
    '/assets',
    {
      preHandler: requirePermission('article:create', container),
      schema: { body: createAssetBodySchema },
    },
    async (request, reply) => {
      const body = request.body;
      const asset = KnowledgeAsset.create({
        slug: slugify(body.title),
        title: body.title,
        summary: body.summary ?? null,
        contentType: body.contentType,
        categoryId: body.categoryId ?? null,
        difficulty: body.difficulty ?? null,
        content: body.content ?? null,
        rawContent: body.rawContent ?? null,
        metadata: body.metadata ?? null,
        authorId: request.session.userId ?? null,
      });

      await container.knowledgeAssetRepository.save(asset);
      if (body.tags.length > 0) {
        await linkTags(container, asset.id, body.tags);
      }

      return reply.status(201).send(toAssetJson(asset));
    },
  );

  app.get(
    '/assets',
    {
      preHandler: requirePermission('article:view', container),
      schema: { querystring: adminListAssetsQuerySchema },
    },
    async (request) => {
      const query = request.query;
      const result = await container.knowledgeAssetRepository.findAll({
        page: query.page,
        pageSize: query.limit,
        ...(query.status ? { status: query.status } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        includeDeleted: true,
      });

      return {
        items: result.items.map(toAssetJson),
        total: result.total,
        page: result.page,
        limit: result.pageSize,
      };
    },
  );

  app.get(
    '/assets/:id',
    {
      preHandler: requirePermission('article:view', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }
      return toAssetJson(asset);
    },
  );

  app.put(
    '/assets/:id',
    {
      preHandler: requirePermission('article:update', container),
      schema: { params: idParamSchema, body: updateAssetBodySchema },
    },
    async (request, reply) => {
      const existing = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const body = request.body;
      if (body.rawContent !== undefined && body.rawContent !== existing.rawContent) {
        await container.assetVersionService.createSnapshot(
          existing.id,
          existing.rawContent,
          existing.metadata,
          request.session.userId,
        );
      }

      const updated = existing.update({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.contentType !== undefined ? { contentType: body.contentType } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
        ...(body.content !== undefined ? { content: body.content } : {}),
        ...(body.rawContent !== undefined ? { rawContent: body.rawContent } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
      });

      await container.knowledgeAssetRepository.save(updated);
      return toAssetJson(updated);
    },
  );

  app.delete(
    '/assets/:id',
    {
      preHandler: requirePermission('article:delete', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const existing = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ error: 'not_found' });
      }

      try {
        const deleted = existing.softDelete();
        await container.knowledgeAssetRepository.save(deleted);
        await container.auditService.log(
          request.session.userId,
          'delete',
          'knowledge_asset',
          existing.id,
        );
        await container.searchRepository.removeAsset(existing.id);
        return toAssetJson(deleted);
      } catch (error) {
        return handleDomainError(error, reply);
      }
    },
  );

  const lifecycleRoutes: Array<{
    path: string;
    permission: string;
    action: string;
    transition: (asset: KnowledgeAsset) => KnowledgeAsset;
  }> = [
    {
      path: '/assets/:id/submit-review',
      permission: 'article:update',
      action: 'submit_review',
      transition: (a) => a.submitForReview(),
    },
    {
      path: '/assets/:id/approve',
      permission: 'article:publish',
      action: 'approve',
      transition: (a) => a.approve(),
    },
    {
      path: '/assets/:id/publish',
      permission: 'article:publish',
      action: 'publish',
      transition: (a) => a.publish(),
    },
    {
      path: '/assets/:id/archive',
      permission: 'article:archive',
      action: 'archive',
      transition: (a) => a.archive(),
    },
    {
      path: '/assets/:id/restore',
      permission: 'article:restore',
      action: 'restore',
      transition: (a) => a.restore(),
    },
  ];

  for (const route of lifecycleRoutes) {
    app.post(
      route.path,
      {
        preHandler: requirePermission(route.permission, container),
        schema: { params: idParamSchema },
      },
      async (request, reply) => {
        const existing = await container.knowledgeAssetRepository.findById(request.params.id);
        if (!existing) {
          return reply.status(404).send({ error: 'not_found' });
        }

        try {
          const updated = route.transition(existing);
          await container.knowledgeAssetRepository.save(updated);
          await container.auditService.log(
            request.session.userId,
            route.action,
            'knowledge_asset',
            existing.id,
            { from: existing.status, to: updated.status },
          );
          return toAssetJson(updated);
        } catch (error) {
          return handleDomainError(error, reply);
        }
      },
    );
  }

  app.get(
    '/assets/:id/versions',
    {
      preHandler: requirePermission('article:view', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }
      const versions = await container.assetVersionService.listVersions(request.params.id);
      return versions.map((v) => ({
        id: v.id,
        assetId: v.assetId,
        gitSha: v.gitSha,
        authorId: v.authorId,
        createdAt: v.createdAt.toISOString(),
      }));
    },
  );

  app.get(
    '/assets/:id/versions/:versionId',
    {
      preHandler: requirePermission('article:view', container),
      schema: { params: versionIdParamSchema },
    },
    async (request, reply) => {
      const version = await container.assetVersionService.getVersion(
        request.params.id,
        request.params.versionId,
      );
      if (!version) {
        return reply.status(404).send({ error: 'not_found' });
      }
      return {
        id: version.id,
        assetId: version.assetId,
        rawContent: version.rawContent,
        metadata: version.metadata,
        gitSha: version.gitSha,
        authorId: version.authorId,
        createdAt: version.createdAt.toISOString(),
      };
    },
  );

  app.post(
    '/assets/:id/versions/:versionId/restore',
    {
      preHandler: requirePermission('article:update', container),
      schema: { params: versionIdParamSchema },
    },
    async (request, reply) => {
      const existing = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!existing) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const version = await container.assetVersionService.getVersion(
        request.params.id,
        request.params.versionId,
      );
      if (!version) {
        return reply.status(404).send({ error: 'not_found' });
      }

      await container.assetVersionService.createSnapshot(
        existing.id,
        existing.rawContent,
        existing.metadata as Record<string, unknown> | null,
        request.session.userId,
      );

      const restored = existing.update({
        rawContent: version.rawContent,
        metadata: version.metadata as Record<string, unknown> | null,
      });
      await container.knowledgeAssetRepository.save(restored);
      await container.auditService.log(
        request.session.userId,
        'restore_version',
        'knowledge_asset',
        existing.id,
        { versionId: version.id },
      );

      return toAssetJson(restored);
    },
  );

  app.post(
    '/assets/:id/concepts',
    {
      preHandler: requirePermission('concept:update', container),
      schema: { params: idParamSchema, body: linkConceptBodySchema },
    },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }
      const concept = await container.prisma.concept.findUnique({
        where: { id: request.body.conceptId },
      });
      if (!concept) {
        return reply.status(404).send({ error: 'concept_not_found' });
      }
      await container.prisma.knowledgeAssetConcept.upsert({
        where: {
          assetId_conceptId: {
            assetId: request.params.id,
            conceptId: request.body.conceptId,
          },
        },
        create: { assetId: request.params.id, conceptId: request.body.conceptId },
        update: {},
      });
      return reply.status(201).send({ ok: true });
    },
  );

  app.delete(
    '/assets/:id/concepts/:conceptId',
    {
      preHandler: requirePermission('concept:update', container),
      schema: { params: conceptLinkParamSchema },
    },
    async (request, reply) => {
      await container.prisma.knowledgeAssetConcept.deleteMany({
        where: {
          assetId: request.params.id,
          conceptId: request.params.conceptId,
        },
      });
      return reply.status(200).send({ ok: true });
    },
  );

  app.post(
    '/assets/:id/references',
    {
      preHandler: requirePermission('reference:update', container),
      schema: { params: idParamSchema, body: linkReferenceBodySchema },
    },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }
      const reference = await container.prisma.reference.findUnique({
        where: { id: request.body.referenceId },
      });
      if (!reference) {
        return reply.status(404).send({ error: 'reference_not_found' });
      }
      await container.prisma.knowledgeAssetReference.upsert({
        where: {
          assetId_referenceId: {
            assetId: request.params.id,
            referenceId: request.body.referenceId,
          },
        },
        create: { assetId: request.params.id, referenceId: request.body.referenceId },
        update: {},
      });
      return reply.status(201).send({ ok: true });
    },
  );

  app.delete(
    '/assets/:id/references/:refId',
    {
      preHandler: requirePermission('reference:update', container),
      schema: { params: referenceLinkParamSchema },
    },
    async (request, reply) => {
      await container.prisma.knowledgeAssetReference.deleteMany({
        where: {
          assetId: request.params.id,
          referenceId: request.params.refId,
        },
      });
      return reply.status(200).send({ ok: true });
    },
  );

  // GET /api/v1/admin/assets/:id/git-history - Get git history for an asset
  app.get(
    '/assets/:id/git-history',
    {
      preHandler: requirePermission('article:view', container),
      schema: { params: idParamSchema },
    },
    async (request, reply) => {
      const asset = await container.knowledgeAssetRepository.findById(request.params.id);
      if (!asset) {
        return reply.status(404).send({ error: 'not_found' });
      }

      const metadata = asset.metadata as Record<string, unknown> | null;
      const gitPath = metadata?.gitPath as string | undefined;

      if (!gitPath) {
        return reply
          .status(404)
          .send({ error: 'no_git_history', message: 'Asset has no associated git path' });
      }

      try {
        const history = await container.gitAdapter.getFileHistory(
          process.env.GIT_REPO_PATH || '',
          gitPath,
        );
        return history;
      } catch (error) {
        console.error('[GitHistory] Failed to get file history:', error);
        return reply.status(500).send({ error: 'Failed to retrieve git history' });
      }
    },
  );
}
