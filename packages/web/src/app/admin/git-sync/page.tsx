'use client';

import { useEffect, useState } from 'react';
import { listGitSyncJobs, triggerGitSync, getGitSyncJob } from '@/lib/admin-api';
import type { GitSyncJob } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

export default function GitSyncPage() {
  const [jobs, setJobs] = useState<GitSyncJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState<GitSyncJob | null>(null);
  const [selected, setSelected] = useState<GitSyncJob | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const result = await listGitSyncJobs(p, 10);
      setJobs(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTrigger = async () => {
    setTriggering(true);
    setError(null);
    try {
      const result = await triggerGitSync();
      const job = await getGitSyncJob(result.jobId);
      setPolling(job);
      const poll = async () => {
        const current = await getGitSyncJob(result.jobId);
        setPolling(current);
        if (current.status === 'PENDING' || current.status === 'RUNNING') {
          setTimeout(poll, 2000);
        } else {
          setPolling(null);
          load(1);
        }
      };
      poll();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to trigger sync');
      setTriggering(false);
    }
  };

  const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Git Sync</h1>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Repository Sync</h2>
            <p className="text-sm text-gray-500 mt-1">
              Synchronize content between Git and the knowledge base.
            </p>
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering || !!polling}
            className="btn-primary"
          >
            {triggering ? 'Triggering...' : 'Trigger Sync Now'}
          </button>
        </div>
        {polling && (
          <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
            <p className="font-medium text-blue-900">Sync in progress...</p>
            <p className="text-sm text-blue-700">
              Job {polling.id.slice(0, 8)}... — {polling.status}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Sync History</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No sync jobs yet.</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Trigger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Synced
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Started
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[job.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{job.trigger}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{job.syncedCount ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelected(job)}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 10 && (
              <div className="flex justify-center gap-2 p-4">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {Math.ceil(total / 10)}
                </span>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= Math.ceil(total / 10)}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Sync Job Detail</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Job ID</dt>
                <dd className="text-sm text-gray-900 font-mono">{selected.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[selected.status] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {selected.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Trigger</dt>
                <dd className="text-sm text-gray-900">{selected.trigger}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Synced Count</dt>
                <dd className="text-sm text-gray-900">{selected.syncedCount ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Repository</dt>
                <dd className="text-sm text-gray-900 break-all">{selected.repository || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Started</dt>
                <dd className="text-sm text-gray-900">
                  {selected.startedAt ? new Date(selected.startedAt).toLocaleString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Completed</dt>
                <dd className="text-sm text-gray-900">
                  {selected.completedAt ? new Date(selected.completedAt).toLocaleString() : '—'}
                </dd>
              </div>
              {selected.errorMessage && (
                <div className="rounded bg-red-50 p-3">
                  <dt className="text-sm font-medium text-red-800">Error</dt>
                  <dd className="text-sm text-red-700">{selected.errorMessage}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
