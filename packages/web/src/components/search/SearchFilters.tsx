'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import type { CategoryNode, Tag } from '@/lib/api.types';

interface SearchFiltersProps {
  categories: CategoryNode[];
  tags: Tag[];
}

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flattenCategories(n.children)]);
}

export function SearchFilters({ categories, tags }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const contentType = searchParams.get('contentType') ?? '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/search?${params.toString()}`);
  };

  const flatCategories = flattenCategories(categories);

  return (
    <aside className="card space-y-6" aria-label="Search filters">
      <h2 className="text-sm font-semibold text-gray-900">Filters</h2>

      <div>
        <label htmlFor="filter-category" className="mb-1 block text-xs font-medium text-gray-700">
          Category
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="input-field"
        >
          <option value="">All categories</option>
          {flatCategories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {'—'.repeat(cat.depth)} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-tag" className="mb-1 block text-xs font-medium text-gray-700">
          Tag
        </label>
        <select
          id="filter-tag"
          value={tag}
          onChange={(e) => updateFilter('tag', e.target.value)}
          className="input-field"
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name} ({t.assetCount})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-difficulty" className="mb-1 block text-xs font-medium text-gray-700">
          Difficulty
        </label>
        <select
          id="filter-difficulty"
          value={difficulty}
          onChange={(e) => updateFilter('difficulty', e.target.value)}
          className="input-field"
        >
          <option value="">Any difficulty</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      <div>
        <label htmlFor="filter-type" className="mb-1 block text-xs font-medium text-gray-700">
          Content type
        </label>
        <select
          id="filter-type"
          value={contentType}
          onChange={(e) => updateFilter('contentType', e.target.value)}
          className="input-field"
        >
          <option value="">All types</option>
          <option value="TUTORIAL">Tutorial</option>
          <option value="CONCEPT">Concept</option>
          <option value="REFERENCE_MATERIAL">Reference</option>
          <option value="RESEARCH_NOTE">Research note</option>
        </select>
      </div>

      {(category || tag || difficulty || contentType) && (
        <Link
          href={`/search?q=${encodeURIComponent(q)}`}
          className="text-sm text-brand-600 hover:underline"
        >
          Clear filters
        </Link>
      )}
    </aside>
  );
}
