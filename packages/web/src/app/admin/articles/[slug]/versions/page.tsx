'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listAssetVersions, getAssetVersion, restoreAssetVersion } from '@/lib/admin-api';
import type { AssetVersion } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

export default function VersionHistoryPage({ params }: { params: { slug: string } }) {
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [selected, setSelected] = useState<AssetVersion | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAssetVersions(params.slug)
      .then((v) => {
        if (cancelled) return;
        setVersions(v);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load versions');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const handleView = async (version: AssetVersion) => {
    setSelected(version);
    setPreview(null);
    try {
      const full = await getAssetVersion(params.slug, version.id);
      setPreview(full.rawContent || '*No content*');
    } catch {
      setPreview('Failed to load version content');
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Restore this version? Current content will be saved as a new version.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await restoreAssetVersion(params.slug, versionId);
      window.location.href = `/admin/articles/${params.slug}/edit`;
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to restore version');
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/articles/${params.slug}/edit`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Edit
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Version History</h1>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">Versions</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No versions yet.</div>
          ) : (
            <ul className="divide-y">
              {versions.map((version, idx) => (
                <li key={version.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Version {versions.length - idx}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                      {version.gitSha && (
                        <p className="text-xs text-gray-400">Git: {version.gitSha.slice(0, 7)}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(version)}
                        className="text-sm text-brand-600 hover:text-brand-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRestore(version.id)}
                        disabled={actionLoading}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">
              {selected
                ? `Version ${versions.length - versions.findIndex((v) => v.id === selected.id)} Preview`
                : 'Select a version to preview'}
            </h2>
          </div>
          <div className="p-4">
            {!selected ? (
              <p className="text-center text-gray-500 py-8">Click "View" on a version.</p>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-900">{preview}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
