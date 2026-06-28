import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { ArticleCard } from '@/components/articles/ArticleCard';
import { Breadcrumb } from '@/components/articles/Breadcrumb';
import { ApiClientError, getConcept, listConcepts } from '@/lib/api';
import { buildMetadata } from '@/lib/metadata';

export const revalidate = 300;

interface ConceptPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ConceptPageProps): Promise<Metadata> {
  try {
    const concept = await getConcept(params.slug);
    return buildMetadata({
      title: concept.name,
      description: concept.description ?? `Knowledge about ${concept.name}.`,
      path: `/concepts/${params.slug}`,
    });
  } catch {
    return buildMetadata({
      title: 'Concept not found',
      description: 'The requested concept could not be found.',
      path: `/concepts/${params.slug}`,
    });
  }
}

export default async function ConceptPage({ params }: ConceptPageProps) {
  let concept;
  try {
    concept = await getConcept(params.slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const assets = concept.assets ?? [];

  let relatedConcepts: Awaited<ReturnType<typeof listConcepts>>['items'] = [];
  if (concept.domain) {
    try {
      const allConcepts = await listConcepts(1, 100);
      relatedConcepts = allConcepts.items.filter(
        (c) => c.slug !== concept.slug && c.domain === concept.domain,
      );
    } catch {
      relatedConcepts = [];
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: concept.name }]} />
      <h1 className="mb-2 text-3xl font-bold text-gray-900">{concept.name}</h1>
      {concept.domain && (
        <p className="mb-2 text-sm font-medium text-brand-600">Domain: {concept.domain}</p>
      )}
      {concept.description && <p className="mb-8 text-lg text-gray-600">{concept.description}</p>}

      <section className="mb-12" aria-labelledby="linked-assets-heading">
        <h2 id="linked-assets-heading" className="mb-4 text-xl font-semibold text-gray-900">
          Linked Knowledge Assets
        </h2>
        {assets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {assets.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No linked articles yet.</p>
        )}
      </section>

      {relatedConcepts.length > 0 && (
        <section className="mt-12" aria-labelledby="related-concepts-heading">
          <h2 id="related-concepts-heading" className="mb-4 text-xl font-semibold text-gray-900">
            Related Concepts
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {relatedConcepts.map((related) => (
              <li key={related.id}>
                <Link
                  href={`/concepts/${related.slug}`}
                  className="card block transition-shadow hover:shadow-md"
                >
                  <h3 className="font-medium text-brand-600">{related.name}</h3>
                  {related.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{related.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {concept.aliases && concept.aliases.length > 0 && (
        <section aria-labelledby="aliases-heading">
          <h2 id="aliases-heading" className="mb-2 text-sm font-semibold text-gray-900">
            Also known as
          </h2>
          <ul className="flex flex-wrap gap-2">
            {concept.aliases.map((alias) => (
              <li key={alias} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {alias}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-sm text-gray-600">
        <Link href="/articles" className="text-brand-600 hover:underline">
          Browse all articles
        </Link>
      </p>
    </div>
  );
}
