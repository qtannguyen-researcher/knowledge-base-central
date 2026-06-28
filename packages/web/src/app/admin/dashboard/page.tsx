import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import {
  listAdminAssets,
  listAdminCategories,
  listAdminTags,
  listAdminConcepts,
  listPendingComments,
  listCorrections,
  listAuditLogs,
  listGitSyncJobs,
} from '@/lib/admin-api';

export const metadata: Metadata = buildMetadata({
  title: 'Dashboard',
  description: 'Admin dashboard overview',
  path: '/admin/dashboard',
});

function getServerCookies(): string {
  const cookieStore = cookies();
  return cookieStore.toString();
}

interface StatCardProps {
  title: string;
  value: string | number;
  href?: string;
  color?: string;
}

function StatCard({ title, value, href, color = 'bg-brand-50 text-brand-700' }: StatCardProps) {
  const content = (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="block hover:shadow-md transition-shadow">
        {content}
      </a>
    );
  }
  return content;
}

export default async function DashboardPage() {
  const serverCookies = getServerCookies();
  const cookieOption = { serverCookies };

  const [
    assetsResult,
    categories,
    tags,
    concepts,
    pendingComments,
    corrections,
    recentAudit,
    lastSync,
  ] = await Promise.all([
    listAdminAssets({ limit: 1 }, cookieOption),
    listAdminCategories(cookieOption),
    listAdminTags(cookieOption),
    listAdminConcepts(1, 1, cookieOption),
    listPendingComments(1, 1, undefined, cookieOption),
    listCorrections(1, 1, undefined, undefined, cookieOption),
    listAuditLogs(1, 10, undefined, undefined, undefined, cookieOption),
    listGitSyncJobs(1, 1, cookieOption),
  ]);

  const [drafts, inReview, published] = await Promise.all([
    listAdminAssets({ limit: 1, status: 'DRAFT' }, cookieOption),
    listAdminAssets({ limit: 1, status: 'REVIEW' }, cookieOption),
    listAdminAssets({ limit: 1, status: 'PUBLISHED' }, cookieOption),
  ]);

  const lastSyncJob = lastSync.items[0];
  const syncStatus = lastSyncJob
    ? `${lastSyncJob.status} (${lastSyncJob.syncedCount ?? 0} synced)`
    : 'No sync yet';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Articles" value={assetsResult.total} href="/admin/articles" />
        <StatCard
          title="Published"
          value={published.total}
          href="/admin/articles?status=PUBLISHED"
          color="text-green-600"
        />
        <StatCard
          title="In Review"
          value={inReview.total}
          href="/admin/articles?status=REVIEW"
          color="text-yellow-600"
        />
        <StatCard
          title="Drafts"
          value={drafts.total}
          href="/admin/articles?status=DRAFT"
          color="text-gray-600"
        />
        <StatCard
          title="Categories"
          value={categories.length}
          href="/admin/categories"
          color="text-purple-600"
        />
        <StatCard title="Tags" value={tags.length} href="/admin/tags" color="text-blue-600" />
        <StatCard
          title="Concepts"
          value={concepts.total}
          href="/admin/concepts"
          color="text-indigo-600"
        />
        <StatCard
          title="Pending Comments"
          value={pendingComments.total}
          href="/admin/moderation/comments"
          color="text-orange-600"
        />
        <StatCard
          title="Open Corrections"
          value={corrections.total}
          href="/admin/moderation/corrections"
          color="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentAudit.items.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {recentAudit.items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.resource} {entry.resourceId.slice(0, 8)}...
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <a href="/admin/audit" className="mt-4 block text-sm text-brand-600 hover:text-brand-700">
            View all activity →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Git Sync Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Sync</span>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  lastSyncJob?.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : lastSyncJob?.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {syncStatus}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {lastSyncJob?.startedAt
                ? `Started: ${new Date(lastSyncJob.startedAt).toLocaleString()}`
                : 'No sync jobs yet'}
            </p>
            {lastSyncJob?.errorMessage && (
              <p className="text-sm text-red-600">{lastSyncJob.errorMessage}</p>
            )}
          </div>
          <a
            href="/admin/git-sync"
            className="mt-4 block text-sm text-brand-600 hover:text-brand-700"
          >
            Manage syncs →
          </a>
        </div>
      </div>
    </div>
  );
}
