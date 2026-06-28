import type { Metadata } from 'next';

import { ArticleCard } from '@/components/articles/ArticleCard';
import { Pagination } from '@/components/ui/Pagination';
import { listAssets } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: 'Articles',
  description: 'Browse all published knowledge articles.',
  path: '/articles',
});

interface ArticlesPageProps {
  searchParams: { page?: string };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const page = Number(searchParams.page ?? '1') || 1;
  let result = {
    items: [] as Awaited<ReturnType<typeof listAssets>>['items'],
    total: 0,
    page,
    limit: 12,
  };
  try {
    result = await listAssets({ page, limit: 12 });
  } catch {
    // empty state
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Articles</h1>
      {result.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.items.map((article) => (
              <ArticleCard key={article.id} article={article} showCategory />
            ))}
          </div>
          <Pagination
            page={result.page}
            total={result.total}
            limit={result.limit}
            basePath="/articles"
          />
        </>
      ) : (
        <p className="text-gray-600">No articles found.</p>
      )}
    </div>
  );
}
