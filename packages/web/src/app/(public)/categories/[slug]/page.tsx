import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleCard } from '@/components/articles/ArticleCard';
import { Breadcrumb } from '@/components/articles/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { ApiClientError, getCategory, listAssets } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

interface CategoryDetailPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

function pathToBreadcrumbs(path: string, categoryName: string) {
  const segments = path.split('/').filter(Boolean);
  const items: Array<{ label: string; href?: string }> = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
  ];

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    items.push({
      label: isLast
        ? categoryName
        : segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      ...(isLast ? {} : { href: `/categories/${segment}` }),
    });
  });

  return items;
}

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  try {
    const category = await getCategory(params.slug);
    return buildMetadata({
      title: category.name,
      description: category.description ?? `Articles in ${category.name}.`,
      path: `/categories/${params.slug}`,
    });
  } catch {
    return buildMetadata({
      title: 'Category not found',
      description: 'The requested category could not be found.',
      path: `/categories/${params.slug}`,
    });
  }
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  let category;
  try {
    category = await getCategory(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const page = Number(searchParams.page ?? '1') || 1;
  const limit = 12;
  const assetsResult = await listAssets({
    categorySlug: params.slug,
    page,
    limit,
  });

  const breadcrumbItems = pathToBreadcrumbs(category.path, category.name);

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{category.name}</h1>
      {category.description && <p className="mb-8 text-gray-600">{category.description}</p>}

      {assetsResult.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {assetsResult.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <Pagination
            page={assetsResult.page}
            total={assetsResult.total}
            limit={assetsResult.limit}
            basePath={`/categories/${params.slug}`}
          />
        </>
      ) : (
        <p className="text-gray-600">No published articles in this category yet.</p>
      )}
    </div>
  );
}
