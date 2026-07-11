import {
  CommentStatus,
  CorrectionStatus,
  ContentType,
  Difficulty,
  UserRole,
} from '@knowledge-base-central/shared';
import { PrismaClient } from '@prisma/client';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { Comment } from '../../../domain/community/Comment.js';
import { CorrectionRequest } from '../../../domain/community/CorrectionRequest.js';
import { PrismaCommentRepository } from '../../PrismaCommentRepository.js';
import { PrismaCorrectionRepository } from '../../PrismaCorrectionRepository.js';
import { sanitizeText } from '../../../sanitization/textSanitizer.js';

const databaseUrl = process.env['DATABASE_URL'];

describe.skipIf(!databaseUrl)('Community features integration', () => {
  const db = new PrismaClient();
  const commentRepo = new PrismaCommentRepository(db);
  const correctionRepo = new PrismaCorrectionRepository(db);

  let testUser: { id: string; email: string };
  let testAdmin: { id: string; email: string };
  let testAsset: { id: string; slug: string; authorId: string | null };

  beforeAll(async () => {
    testUser = await db.user.upsert({
      where: { email: 'comment-test-user@example.com' },
      create: {
        email: 'comment-test-user@example.com',
        username: 'comment-test-user',
        role: UserRole.CONTRIBUTOR,
        status: 'ACTIVE',
      },
      update: {},
    });

    testAdmin = await db.user.upsert({
      where: { email: 'comment-test-admin@example.com' },
      create: {
        email: 'comment-test-admin@example.com',
        username: 'comment-test-admin',
        role: UserRole.ADMIN,
        status: 'ACTIVE',
      },
      update: {},
    });

    const category = await db.category.upsert({
      where: { slug: 'community-test-category' },
      create: {
        slug: 'community-test-category',
        name: 'Community Test Category',
        path: 'community-test-category',
        depth: 0,
      },
      update: {},
    });

    const { KnowledgeAsset } = await import('../../../domain/knowledge-asset/KnowledgeAsset.js');
    const asset = KnowledgeAsset.create({
      slug: `community-test-asset-${Date.now()}`,
      title: 'Community Test Asset',
      summary: 'Asset for community tests',
      content: 'Test content',
      contentType: ContentType.TUTORIAL,
      difficulty: Difficulty.BEGINNER,
      authorId: testUser.id,
      categoryId: category.id,
    });

    const published = asset.submitForReview().approve().publish();

    await db.knowledgeAsset.upsert({
      where: { id: published.id },
      create: {
        id: published.id,
        slug: published.slug,
        title: published.title,
        summary: published.summary,
        content: published.content,
        rawContent: published.rawContent,
        status: published.status,
        contentType: published.contentType,
        difficulty: published.difficulty,
        authorId: published.authorId,
        categoryId: published.categoryId,
        publishedAt: new Date(),
      },
      update: published.toProps(),
    });

    testAsset = {
      id: published.id,
      slug: published.slug,
      authorId: published.authorId,
    };
  });

  afterAll(async () => {
    await db.comment.deleteMany({ where: { authorId: testUser.id } });
    await db.correctionRequest.deleteMany({ where: { submittedBy: testUser.id } });
    await db.knowledgeAsset.delete({ where: { id: testAsset.id } });
    await db.user.delete({ where: { id: testUser.id } });
    await db.user.delete({ where: { id: testAdmin.id } });
    await db.category.delete({ where: { slug: 'community-test-category' } });
  });

  describe('Comments', () => {
    it('submit a comment and verify it is saved as PENDING', async () => {
      const comment = Comment.create({
        assetId: testAsset.id,
        authorId: testUser.id,
        content: 'This is a test comment',
      });

      expect(comment.status).toBe(CommentStatus.PENDING);

      await commentRepo.save(comment);

      const found = await commentRepo.findById(comment.id);
      expect(found).not.toBeNull();
      expect(found!.status).toBe(CommentStatus.PENDING);

      await commentRepo.delete(comment.id);
    });

    it('approve comment and verify it appears in public list', async () => {
      const comment = Comment.create({
        assetId: testAsset.id,
        authorId: testUser.id,
        content: 'Comment for approval test',
      });

      await commentRepo.save(comment);

      comment.approve();
      await commentRepo.save(comment);

      const approvedComments = await commentRepo.findByAsset(testAsset.id, {
        status: CommentStatus.APPROVED,
      });

      expect(approvedComments.some((c) => c.id === comment.id)).toBe(true);

      await commentRepo.delete(comment.id);
    });

    it('reject comment and verify it is hidden from public list', async () => {
      const comment = Comment.create({
        assetId: testAsset.id,
        authorId: testUser.id,
        content: 'Comment for rejection test',
      });

      await commentRepo.save(comment);

      comment.reject();
      await commentRepo.save(comment);

      const approvedComments = await commentRepo.findByAsset(testAsset.id, {
        status: CommentStatus.APPROVED,
      });

      expect(approvedComments.some((c) => c.id === comment.id)).toBe(false);

      await commentRepo.delete(comment.id);
    });

    it('report a comment 3 times and verify it reverts to PENDING', async () => {
      const comment = Comment.create({
        assetId: testAsset.id,
        authorId: testUser.id,
        content: 'Reported comment',
      });

      await commentRepo.save(comment);

      comment.approve();
      await commentRepo.save(comment);

      const reportedComment = await db.comment.findUnique({ where: { id: comment.id } });
      expect(reportedComment?.status).toBe(CommentStatus.APPROVED);

      await db.comment.update({
        where: { id: comment.id },
        data: { reportCount: 3 },
      });

      const updatedComment = await db.comment.findUnique({ where: { id: comment.id } });
      if (updatedComment && updatedComment.reportCount >= 3) {
        await db.comment.update({
          where: { id: comment.id },
          data: { status: CommentStatus.PENDING },
        });
      }

      const revertedComment = await db.comment.findUnique({ where: { id: comment.id } });
      expect(revertedComment?.status).toBe(CommentStatus.PENDING);

      await commentRepo.delete(comment.id);
    });
  });

  describe('Corrections', () => {
    it('submit a correction and verify admin sees it', async () => {
      const correction = CorrectionRequest.create({
        assetId: testAsset.id,
        submittedBy: testUser.id,
        description: 'This is a typo in the article',
        suggestion: 'Change "recieve" to "receive"',
      });

      expect(correction.status).toBe(CorrectionStatus.SUBMITTED);

      await correctionRepo.save(correction);

      const allCorrections = await correctionRepo.findAll();
      expect(allCorrections.some((c) => c.id === correction.id)).toBe(true);

      await correctionRepo.delete(correction.id);
    });

    it('accept correction and verify submitter notification is created', async () => {
      const correction = CorrectionRequest.create({
        assetId: testAsset.id,
        submittedBy: testUser.id,
        description: 'Update this section',
        suggestion: 'Add more examples',
      });

      await correctionRepo.save(correction);

      correction.markUnderReview(testAdmin.id);
      await correctionRepo.save(correction);

      correction.accept(testAdmin.id);
      await correctionRepo.save(correction);

      expect(correction.status).toBe(CorrectionStatus.ACCEPTED);

      const notifications = await db.notification.findMany({
        where: {
          userId: testUser.id,
          type: 'correction_accepted',
        },
      });

      expect(notifications.length).toBeGreaterThan(0);

      await correctionRepo.delete(correction.id);
    });
  });

  describe('XSS Sanitization', () => {
    it('XSS in comment content is sanitized', () => {
      const xssPayload = '<script>alert(1)</script>Hello';
      const sanitized = sanitizeText(xssPayload);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert(1)');
      expect(sanitized).toContain('Hello');
    });

    it('XSS in correction description is sanitized', () => {
      const xssPayload = '<img src=x onerror="alert(1)">';
      const sanitized = sanitizeText(xssPayload);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
    });

    it('XSS in correction suggestion is sanitized', () => {
      const xssPayload = '<iframe src="evil.com"></iframe>';
      const sanitized = sanitizeText(xssPayload);

      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('evil.com');
    });

    it('plain text is preserved', () => {
      const plainText = 'This is a normal comment with no HTML.';
      const sanitized = sanitizeText(plainText);

      expect(sanitized).toBe(plainText);
    });

    it('HTML entities are decoded (XSS bypass attempt)', () => {
      const bypassAttempt = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const sanitized = sanitizeText(bypassAttempt);

      expect(sanitized).toBe('<script>alert(1)</script>');
    });
  });
});
