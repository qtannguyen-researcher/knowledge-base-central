import Link from 'next/link';

import type { KnowledgeAsset } from '@/lib/api.types';
import { estimateReadTime } from '@/lib/api';

interface ArticleCardProps {
  article: KnowledgeAsset;
  showCategory?: boolean;
}

export function ArticleCard({ article, showCategory = false }: ArticleCardProps) {
  const readTime = estimateReadTime(article.content ?? article.summary);

  return (
    <article className="card transition-shadow hover:shadow-md">
      <Link href={`/articles/${article.slug}`} className="group block">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600">
          {article.title}
        </h3>
        {article.summary && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{article.summary}</p>
        )}
        <dl className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          {article.difficulty && (
            <div>
              <dt className="sr-only">Difficulty</dt>
              <dd className="rounded-full bg-gray-100 px-2 py-0.5 capitalize">
                {article.difficulty.toLowerCase()}
              </dd>
            </div>
          )}
          <div>
            <dt className="sr-only">Read time</dt>
            <dd>{readTime} min read</dd>
          </div>
          {article.publishedAt && (
            <div>
              <dt className="sr-only">Published</dt>
              <dd>{new Date(article.publishedAt).toLocaleDateString()}</dd>
            </div>
          )}
          {showCategory && article.contentType && (
            <div>
              <dt className="sr-only">Type</dt>
              <dd className="capitalize">{article.contentType.replace(/_/g, ' ').toLowerCase()}</dd>
            </div>
          )}
        </dl>
      </Link>
    </article>
  );
}
