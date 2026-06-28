import Link from 'next/link';

import type { KnowledgeAsset } from '@/lib/api.types';
import { estimateReadTime } from '@/lib/api';

interface ArticleMetadataProps {
  article: KnowledgeAsset;
  categoryName?: string;
  categorySlug?: string;
  tags?: Array<{ slug: string; name: string }>;
}

export function ArticleMetadata({
  article,
  categoryName,
  categorySlug,
  tags = [],
}: ArticleMetadataProps) {
  const readTime = estimateReadTime(article.content ?? article.rawContent);

  return (
    <div className="mb-8 space-y-4 border-b border-gray-200 pb-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {article.title}
      </h1>
      {article.summary && <p className="text-lg text-gray-600">{article.summary}</p>}
      <dl className="flex flex-wrap gap-4 text-sm text-gray-600">
        {categoryName && categorySlug && (
          <div>
            <dt className="sr-only">Category</dt>
            <dd>
              <Link href={`/categories/${categorySlug}`} className="text-brand-600 hover:underline">
                {categoryName}
              </Link>
            </dd>
          </div>
        )}
        {article.difficulty && (
          <div>
            <dt className="font-medium text-gray-900">Difficulty</dt>
            <dd className="capitalize">{article.difficulty.toLowerCase()}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-gray-900">Read time</dt>
          <dd>{readTime} min</dd>
        </div>
        {article.contentType && (
          <div>
            <dt className="font-medium text-gray-900">Type</dt>
            <dd className="capitalize">{article.contentType.replace(/_/g, ' ').toLowerCase()}</dd>
          </div>
        )}
      </dl>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                href={`/tags/${tag.slug}`}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                {tag.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
