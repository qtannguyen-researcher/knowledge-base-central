import Link from 'next/link';

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  basePath: string;
  queryParams?: Record<string, string>;
}

export function Pagination({ page, total, limit, basePath, queryParams = {} }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams({ ...queryParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className="btn-secondary" aria-label="Previous page">
          Previous
        </Link>
      )}
      <span className="text-sm text-gray-600" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className="btn-secondary" aria-label="Next page">
          Next
        </Link>
      )}
    </nav>
  );
}
