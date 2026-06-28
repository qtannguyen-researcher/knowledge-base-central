import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumb } from '@/components/articles/Breadcrumb';
import { ApiClientError, getLearningPath } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

interface LearningPathDetailPageProps {
  params: { slug: string };
  searchParams: { article?: string };
}

export async function generateMetadata({ params }: LearningPathDetailPageProps): Promise<Metadata> {
  try {
    const path = await getLearningPath(params.slug);
    return buildMetadata({
      title: path.title,
      description: path.description ?? `Learning path: ${path.title}`,
      path: `/learning-paths/${params.slug}`,
    });
  } catch {
    return buildMetadata({
      title: 'Learning path not found',
      description: 'The requested learning path could not be found.',
      path: `/learning-paths/${params.slug}`,
    });
  }
}

export default async function LearningPathDetailPage({
  params,
  searchParams,
}: LearningPathDetailPageProps) {
  let path;
  try {
    path = await getLearningPath(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const currentSlug = searchParams.article;
  const currentIndex = currentSlug
    ? path.items.findIndex((item) => item.asset.slug === currentSlug)
    : -1;

  const prevItem = currentIndex > 0 ? path.items[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < path.items.length - 1
      ? path.items[currentIndex + 1]
      : currentIndex === -1 && path.items.length > 0
        ? path.items[0]
        : null;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Learning Paths', href: '/learning-paths' },
          { label: path.title },
        ]}
      />
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{path.title}</h1>
      {path.description && <p className="mb-4 text-gray-600">{path.description}</p>}
      <dl className="mb-8 flex gap-4 text-sm text-gray-500">
        {path.difficulty && (
          <div>
            <dt className="font-medium text-gray-700">Difficulty</dt>
            <dd className="capitalize">{path.difficulty.toLowerCase()}</dd>
          </div>
        )}
        {path.estimatedDuration && (
          <div>
            <dt className="font-medium text-gray-700">Estimated duration</dt>
            <dd>{path.estimatedDuration} minutes</dd>
          </div>
        )}
      </dl>

      <ol className="space-y-3" aria-label="Path articles">
        {path.items.map((item, index) => {
          const isCurrent = currentSlug === item.asset.slug;
          const isPast = currentIndex >= 0 && index < currentIndex;
          return (
            <li key={item.asset.id}>
              <Link
                href={`/articles/${item.asset.slug}?path=${params.slug}`}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50'
                    : isPast
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-brand-300'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    isPast
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                  aria-hidden
                >
                  {isPast ? '✓' : item.position}
                </span>
                <div>
                  <h2 className="font-medium text-gray-900">{item.asset.title}</h2>
                  {item.asset.summary && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-1">{item.asset.summary}</p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {(prevItem || nextItem) && (
        <nav
          className="mt-8 flex justify-between border-t border-gray-200 pt-6"
          aria-label="Path navigation"
        >
          {prevItem ? (
            <Link
              href={`/articles/${prevItem.asset.slug}?path=${params.slug}`}
              className="btn-secondary"
            >
              ← Previous: {prevItem.asset.title}
            </Link>
          ) : (
            <span />
          )}
          {nextItem && (
            <Link
              href={`/articles/${nextItem.asset.slug}?path=${params.slug}`}
              className="btn-secondary"
            >
              Next: {nextItem.asset.title} →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
