import Link from 'next/link';

import { ArticleCard } from '@/components/articles/ArticleCard';
import { listAssets, listCategories } from '@/lib/api';
import { buildMetadata, MISSION_TAGLINE, SITE_NAME } from '@/lib/metadata';

export const revalidate = 60;

export const metadata = buildMetadata({
  title: SITE_NAME,
  description: MISSION_TAGLINE,
  path: '/',
});

export default async function HomePage() {
  let recentArticles: Awaited<ReturnType<typeof listAssets>>['items'] = [];
  let categories: Awaited<ReturnType<typeof listCategories>> = [];

  try {
    const [articlesResult, categoryTree] = await Promise.all([
      listAssets({ limit: 6, page: 1 }),
      listCategories(),
    ]);
    recentArticles = articlesResult.items;
    categories = categoryTree;
  } catch {
    // API unavailable at build time — page renders with empty state and ISR will populate later
  }

  return (
    <div>
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Knowledge Base Central
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">{MISSION_TAGLINE}</p>
      </section>

      <section className="mb-12" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-6 text-2xl font-semibold text-gray-900">
          Explore by Category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="card group transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
                {category.name}
              </h3>
              {category.description && (
                <p className="mt-2 text-sm text-gray-600">{category.description}</p>
              )}
              {category.children.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  {category.children.length} subcategories
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="recent-heading" className="text-2xl font-semibold text-gray-900">
            Recently Published
          </h2>
          <Link href="/articles" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {recentArticles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} showCategory />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No published articles yet.</p>
        )}
      </section>
    </div>
  );
}
