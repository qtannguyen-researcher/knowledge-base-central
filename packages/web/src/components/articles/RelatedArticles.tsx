import Link from 'next/link';

import { ArticleCard } from '@/components/articles/ArticleCard';
import type { KnowledgeAsset } from '@/lib/api.types';

interface RelatedArticlesProps {
  articles: KnowledgeAsset[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-4 text-xl font-semibold text-gray-900">
        Related Articles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-600">
        <Link href="/articles" className="text-brand-600 hover:underline">
          Browse all articles
        </Link>
      </p>
    </section>
  );
}
