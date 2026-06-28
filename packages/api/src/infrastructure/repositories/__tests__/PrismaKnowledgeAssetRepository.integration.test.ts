import {
  ContentType,
  Difficulty,
  KnowledgeAssetStatus,
  UserRole,
} from '@knowledge-base-central/shared';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { KnowledgeAsset } from '../../../domain/knowledge-asset/KnowledgeAsset.js';
import { PrismaKnowledgeAssetRepository } from '../PrismaKnowledgeAssetRepository.js';

const databaseUrl = process.env['DATABASE_URL'];

describe.skipIf(!databaseUrl)('KnowledgeAsset repository integration', () => {
  const db = new PrismaClient();
  const repo = new PrismaKnowledgeAssetRepository(db);

  it('round-trips a knowledge asset save/read cycle', async () => {
    const owner = await db.user.upsert({
      where: { email: 'integration-test@example.com' },
      create: {
        email: 'integration-test@example.com',
        username: 'integration-test',
        passwordHash: await bcrypt.hash('test-password', 10),
        role: UserRole.OWNER,
        status: 'ACTIVE',
      },
      update: {},
    });

    const category = await db.category.upsert({
      where: { slug: 'integration-test-cs' },
      create: {
        slug: 'integration-test-cs',
        name: 'Integration Test CS',
        path: 'integration-test-cs',
        depth: 0,
      },
      update: {},
    });

    const asset = KnowledgeAsset.create({
      slug: `integration-asset-${Date.now()}`,
      title: 'Integration Test Asset',
      summary: 'Summary for integration test',
      content: 'Content body',
      contentType: ContentType.TUTORIAL,
      difficulty: Difficulty.BEGINNER,
      authorId: owner.id,
      categoryId: category.id,
    });

    const published = asset.submitForReview().approve().publish();

    await repo.save(published);

    const byId = await repo.findById(published.id);
    const bySlug = await repo.findBySlug(published.slug);

    expect(byId).not.toBeNull();
    expect(bySlug).not.toBeNull();
    expect(byId?.status).toBe(KnowledgeAssetStatus.PUBLISHED);
    expect(bySlug?.title).toBe('Integration Test Asset');

    await db.knowledgeAsset.delete({ where: { id: published.id } });
  });
});
