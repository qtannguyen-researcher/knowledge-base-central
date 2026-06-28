import { describe, expect, it } from 'vitest';

import { Category } from '../Category.js';

describe('Category.buildPath', () => {
  it('returns slug for root categories', () => {
    expect(Category.buildPath('computer-science')).toBe('computer-science');
  });

  it('builds nested materialized paths', () => {
    const root = new Category({
      id: 'root-id',
      slug: 'computer-science',
      name: 'Computer Science',
      path: 'computer-science',
      depth: 0,
    });

    expect(Category.buildPath('machine-learning', root)).toBe('computer-science/machine-learning');

    const nested = new Category({
      id: 'ml-id',
      slug: 'machine-learning',
      name: 'Machine Learning',
      parentId: root.id,
      path: 'computer-science/machine-learning',
      depth: 1,
    });

    expect(Category.buildPath('deep-learning', nested)).toBe(
      'computer-science/machine-learning/deep-learning',
    );
  });
});
