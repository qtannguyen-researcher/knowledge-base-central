import Link from 'next/link';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { listAdminAssets } from '@/lib/admin-api';
import { Pagination } from '@/components/ui/Pagination';

export const metadata: Metadata = buildMetadata({
  title: 'Articles',
  description: 'Manage knowledge base articles',
  path: '/admin/articles',
});

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  REVIEW: 'In Review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const serverCookies = cookies().toString();
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const status = params.status;
  const queryParams: Parameters<typeof listAdminAssets>[0] = { page, limit: 20 };
  if (status) queryParams.status = status;
  const {
    items,
    total,
    page: currentPage,
    limit,
  } = await listAdminAssets(queryParams, { serverCookies });

  const filterHref = (s?: string) => `/admin/articles${s ? `?status=${s}` : ''}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <Link href="/admin/articles/new" className="btn-primary">
          New Article
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={filterHref()}
          className={`px-3 py-1 rounded-full text-sm font-medium ${!status ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </Link>
        {Object.keys(STATUS_BADGE).map((s) => (
          <Link
            key={s}
            href={filterHref(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${status === s ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {STATUS_LABELS[s] ?? s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No articles found.
                </td>
              </tr>
            ) : (
              items.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="font-medium text-gray-900 hover:text-brand-600"
                    >
                      {article.title}
                    </Link>
                    <p className="text-sm text-gray-500">{article.summary || '—'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE[article.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="text-brand-600 hover:text-brand-700 mr-4"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/articles/${article.id}/versions`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Versions
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={currentPage}
        total={total}
        limit={limit}
        basePath="/admin/articles"
        queryParams={status ? { status } : {}}
      />
    </div>
  );
}
