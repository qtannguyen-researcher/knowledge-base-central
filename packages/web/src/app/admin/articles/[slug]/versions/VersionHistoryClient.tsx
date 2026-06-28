'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AssetVersion } from '@/lib/admin-api';
import { getAssetVersion, restoreAssetVersion } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

interface VersionHistoryClientProps {
  assetId: string;
  versions: AssetVersion[];
}

export function VersionHistoryClient({ assetId, versions }: VersionHistoryClientProps) {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = useState<AssetVersion | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = async (version: AssetVersion) => {
    setSelectedVersion(version);
    setLoading(true);
    try {
      const fullVersion = await getAssetVersion(assetId, version.id);
      setPreviewContent(fullVersion.rawContent || '*No content*');
    } catch (err) {
      setError('Failed to load version content');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (
      !confirm(
        'Are you sure you want to restore this version? Current content will be saved as a new version.',
      )
    ) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await restoreAssetVersion(assetId, versionId);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`Failed to restore: ${err.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mb-6">
        <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Articles
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="font-semibold text-gray-900">Version History</h2>
          </div>
          <ul className="divide-y">
            {versions.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500">No version history available</li>
            ) : (
              versions.map((version, idx) => (
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
                        className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRestore(version.id)}
                        disabled={loading}
                        className="rounded bg-brand-100 px-3 py-1 text-sm text-brand-700 hover:bg-brand-200"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="font-semibold text-gray-900">
              {selectedVersion ? 'Version Preview' : 'Select a version to preview'}
            </h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
              </div>
            ) : previewContent ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Click "View" on a version to see its content
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
