import type { Metadata } from 'next';

import { CategoryTreeView } from '@/components/categories/CategoryTreeView';
import { listCategories } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Categories',
  description: 'Browse the full knowledge category hierarchy.',
  path: '/categories',
});

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof listCategories>> = [];
  try {
    categories = await listCategories();
  } catch {
    // empty state
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Categories</h1>
      <p className="mb-8 text-gray-600">
        Explore knowledge organized by topic. Expand nodes to see subcategories.
      </p>
      <CategoryTreeView categories={categories} />
    </div>
  );
}
