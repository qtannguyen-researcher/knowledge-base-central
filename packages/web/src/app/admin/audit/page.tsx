'use client';

import { useEffect, useState } from 'react';
import { listAuditLogs } from '@/lib/admin-api';
import type { AuditLogEntry } from '@/lib/admin-api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const result = await listAuditLogs(
        p,
        50,
        filterAction || undefined,
        filterResource || undefined,
      );
      setLogs(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Resource', 'Resource ID', 'Payload'];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.actor?.username || log.actorId || 'Unknown',
      log.action,
      log.resource,
      log.resourceId,
      JSON.stringify(log.payload || {}),
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Audit Log</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Action</label>
            <input
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Resource</label>
            <input
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="input-field mt-1"
            />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => load(1)} className="btn-primary">
              Apply
            </button>
            <button
              onClick={() => {
                setFilterAction('');
                setFilterResource('');
                load(1);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={exportCsv} className="btn-secondary">
            Export CSV ({logs.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No audit logs found.</div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className={`cursor-pointer hover:bg-gray-50 ${selected?.id === log.id ? 'bg-brand-50' : ''}`}
                        onClick={() => setSelected(log)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.actor?.username || log.actorId || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.resource}</td>
                        <td className="px-6 py-4 text-right text-sm text-brand-600">View</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {total > 50 && (
                  <div className="flex justify-center gap-2 p-4">
                    <button
                      onClick={() => load(page - 1)}
                      disabled={page <= 1}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {page} of {Math.ceil(total / 50)}
                    </span>
                    <button
                      onClick={() => load(page + 1)}
                      disabled={page >= Math.ceil(total / 50)}
                      className="btn-secondary disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          {selected ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Log Detail</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="text-sm text-gray-900 font-mono">{selected.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(selected.createdAt).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Actor</dt>
                  <dd className="text-sm text-gray-900">
                    {selected.actor?.username || selected.actorId || 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Action</dt>
                  <dd className="text-sm text-gray-900">{selected.action}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resource</dt>
                  <dd className="text-sm text-gray-900">
                    {selected.resource} / {selected.resourceId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">Payload</dt>
                  <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selected.payload || {}, null, 2)}
                    </pre>
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              Select a log entry to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
