import type { Metadata } from 'next';
import Link from 'next/link';

import { listTags } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Tags',
  description: 'Browse articles by tag.',
  path: '/tags',
});

export default async function TagsIndexPage() {
  let tags: Awaited<ReturnType<typeof listTags>> = [];
  try {
    tags = await listTags();
  } catch {
    // empty state
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Tags</h1>
      <p className="mb-8 text-gray-600">Browse knowledge by topic tags.</p>
      <ul className="flex flex-wrap gap-3" aria-label="Tag cloud">
        {tags.map((tag) => (
          <li key={tag.id}>
            <Link
              href={`/tags/${tag.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
            >
              {tag.name}
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-800">
                {tag.assetCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
