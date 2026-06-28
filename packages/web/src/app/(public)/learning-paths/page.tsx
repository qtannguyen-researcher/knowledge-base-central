import type { Metadata } from 'next';
import Link from 'next/link';

import { listLearningPaths } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Learning Paths',
  description: 'Structured learning sequences to guide your study.',
  path: '/learning-paths',
});

export default async function LearningPathsPage() {
  let paths: Awaited<ReturnType<typeof listLearningPaths>> = [];
  try {
    paths = await listLearningPaths();
  } catch {
    // empty state
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Learning Paths</h1>
      <p className="mb-8 text-gray-600">
        Follow curated sequences of articles to build knowledge step by step.
      </p>

      {paths.length > 0 ? (
        <ul className="space-y-4">
          {paths.map((path) => (
            <li key={path.id}>
              <Link
                href={`/learning-paths/${path.slug}`}
                className="card block transition-shadow hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-gray-900">{path.title}</h2>
                {path.description && (
                  <p className="mt-2 text-sm text-gray-600">{path.description}</p>
                )}
                <dl className="mt-3 flex gap-4 text-xs text-gray-500">
                  {path.difficulty && (
                    <div>
                      <dt className="sr-only">Difficulty</dt>
                      <dd className="capitalize">{path.difficulty.toLowerCase()}</dd>
                    </div>
                  )}
                  {path.estimatedDuration && (
                    <div>
                      <dt className="sr-only">Duration</dt>
                      <dd>{path.estimatedDuration} min</dd>
                    </div>
                  )}
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No learning paths published yet.</p>
      )}
    </div>
  );
}
