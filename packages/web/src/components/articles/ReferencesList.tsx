interface ReferencesListProps {
  references: Array<{
    id: string;
    title: string;
    authors?: string[];
    year?: number | null;
    url?: string | null;
  }>;
}

export function ReferencesList({ references }: ReferencesListProps) {
  if (references.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="references-heading">
      <h2 id="references-heading" className="mb-4 text-xl font-semibold text-gray-900">
        References
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
        {references.map((ref) => (
          <li key={ref.id}>
            {ref.url ? (
              <a
                href={ref.url}
                className="text-brand-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {ref.title}
              </a>
            ) : (
              <span>{ref.title}</span>
            )}
            {ref.authors && ref.authors.length > 0 && (
              <span className="text-gray-500"> — {ref.authors.join(', ')}</span>
            )}
            {ref.year && <span className="text-gray-500"> ({ref.year})</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
