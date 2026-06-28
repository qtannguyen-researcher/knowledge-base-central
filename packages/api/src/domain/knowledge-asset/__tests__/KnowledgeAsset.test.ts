import { KnowledgeAssetStatus } from '@knowledge-base-central/shared';
import { describe, expect, it } from 'vitest';

import { DomainError } from '../../errors/DomainError.js';
import { KnowledgeAsset } from '../KnowledgeAsset.js';

describe('KnowledgeAsset state machine', () => {
  const baseProps = {
    slug: 'test-asset',
    title: 'Test Asset',
  };

  it('allows valid workflow transitions', () => {
    const draft = KnowledgeAsset.create(baseProps);
    expect(draft.status).toBe(KnowledgeAssetStatus.DRAFT);

    const inReview = draft.submitForReview();
    expect(inReview.status).toBe(KnowledgeAssetStatus.REVIEW);

    const approved = inReview.approve();
    expect(approved.status).toBe(KnowledgeAssetStatus.APPROVED);

    const published = approved.publish();
    expect(published.status).toBe(KnowledgeAssetStatus.PUBLISHED);
    expect(published.publishedAt).toBeInstanceOf(Date);

    const archived = published.archive();
    expect(archived.status).toBe(KnowledgeAssetStatus.ARCHIVED);
  });

  it('throws on invalid transitions', () => {
    const draft = KnowledgeAsset.create(baseProps);

    expect(() => draft.publish()).toThrow(DomainError);
    expect(() => draft.approve()).toThrow(DomainError);
    expect(() => draft.archive()).toThrow(DomainError);
  });

  it('allows soft delete from any non-deleted state', () => {
    const draft = KnowledgeAsset.create(baseProps);
    const deleted = draft.softDelete();
    expect(deleted.status).toBe(KnowledgeAssetStatus.DELETED);
    expect(deleted.deletedAt).toBeInstanceOf(Date);

    const published = KnowledgeAsset.reconstitute({
      id: 'id-1',
      slug: 'published',
      title: 'Published',
      status: KnowledgeAssetStatus.PUBLISHED,
    });
    const deletedPublished = published.softDelete();
    expect(deletedPublished.status).toBe(KnowledgeAssetStatus.DELETED);
  });

  it('prevents transitions from deleted state', () => {
    const deleted = KnowledgeAsset.reconstitute({
      id: 'id-1',
      slug: 'deleted',
      title: 'Deleted',
      status: KnowledgeAssetStatus.DELETED,
      deletedAt: new Date(),
    });

    expect(deleted.canTransitionTo(KnowledgeAssetStatus.DRAFT)).toBe(false);
    expect(() => deleted.submitForReview()).toThrow(DomainError);
  });
});
