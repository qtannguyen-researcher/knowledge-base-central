import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleCard } from '@/components/articles/ArticleCard';
import { Breadcrumb } from '@/components/articles/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { listAssets, listTags } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

interface TagDetailPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: TagDetailPageProps): Promise<Metadata> {
  const tags = await listTags();
  const tag = tags.find((t) => t.slug === params.slug);
  if (!tag) {
    return buildMetadata({
      title: 'Tag not found',
      description: 'The requested tag could not be found.',
      path: `/tags/${params.slug}`,
    });
  }
  return buildMetadata({
    title: `Tag: ${tag.name}`,
    description: `Articles tagged with ${tag.name}.`,
    path: `/tags/${params.slug}`,
  });
}

export default async function TagDetailPage({ params, searchParams }: TagDetailPageProps) {
  const tags = await listTags();
  const tag = tags.find((t) => t.slug === params.slug);
  if (!tag) {
    notFound();
  }

  const page = Number(searchParams.page ?? '1') || 1;
  const result = await listAssets({ tag: params.slug, page, limit: 12 });

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tags', href: '/tags' },
          { label: tag.name },
        ]}
      />
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{tag.name}</h1>
      <p className="mb-8 text-gray-600">
        {tag.assetCount} article{tag.assetCount !== 1 ? 's' : ''}
      </p>

      {result.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination
            page={result.page}
            total={result.total}
            limit={result.limit}
            basePath={`/tags/${params.slug}`}
          />
        </>
      ) : (
        <p className="text-gray-600">No articles with this tag yet.</p>
      )}
    </div>
  );
}
