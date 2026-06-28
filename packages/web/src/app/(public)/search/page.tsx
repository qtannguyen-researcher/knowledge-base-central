import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { HighlightText } from '@/components/search/HighlightText';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { listCategories, listTags, search } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search the knowledge base.',
  path: '/search',
});

interface SearchPageProps {
  searchParams: {
    q?: string;
    page?: string;
    category?: string;
    tag?: string;
    difficulty?: string;
    contentType?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q?.trim() ?? '';
  const page = Number(searchParams.page ?? '1') || 1;
  const category = searchParams.category;
  const tag = searchParams.tag;
  const difficulty = searchParams.difficulty;
  const contentType = searchParams.contentType;

  const [categories, tags] = await Promise.all([
    listCategories().catch(() => [] as Awaited<ReturnType<typeof listCategories>>),
    listTags().catch(() => [] as Awaited<ReturnType<typeof listTags>>),
  ]);

  let results: Awaited<ReturnType<typeof search>> | null = null;

  if (q) {
    try {
      results = await search({
        q,
        page,
        limit: 20,
        ...(category && { category }),
        ...(tag && { tag }),
        ...(difficulty && { difficulty }),
        ...(contentType && { contentType }),
      });
    } catch {
      results = { results: [], total: 0, page, limit: 20, totalPages: 0 };
    }
  }

  const displayResults = results?.results ?? [];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Search</h1>
      <div className="mb-8">
        <SearchBar defaultQuery={q} />
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-200" />}>
          <div className="lg:col-span-1">
            <SearchFilters categories={categories} tags={tags} />
          </div>
        </Suspense>

        <div className="lg:col-span-3">
          {!q ? (
            <p className="text-gray-600">Enter a search term to find articles.</p>
          ) : displayResults.length > 0 ? (
            <ul className="space-y-4" aria-label="Search results">
              {displayResults.map((result) => (
                <li key={result.slug} className="card">
                  <Link href={`/articles/${result.slug}`} className="group">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
                      <HighlightText text={result.title} query={q} />
                    </h2>
                    {result.summary && (
                      <p className="mt-2 text-sm text-gray-600">
                        <HighlightText text={result.summary} query={q} />
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card text-center" role="status">
              <h2 className="text-lg font-semibold text-gray-900">No results found</h2>
              <p className="mt-2 text-gray-600">
                Try different keywords, remove filters, or browse by category.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/categories" className="text-brand-600 hover:underline">
                    Browse categories
                  </Link>
                </li>
                <li>
                  <Link href="/tags" className="text-brand-600 hover:underline">
                    Browse tags
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className="text-brand-600 hover:underline">
                    View all articles
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
