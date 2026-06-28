'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { KnowledgeAsset } from '@/lib/api.types';
import type { AssetVersion } from '@/lib/admin-api';
import {
  updateAdminAsset,
  submitAssetForReview,
  approveAsset,
  publishAsset,
  archiveAsset,
  restoreAsset,
  restoreAssetVersion,
} from '@/lib/admin-api';
import { listAdminCategories } from '@/lib/admin-api';
import { listTags, listConcepts } from '@/lib/api';
import { ApiClientError } from '@/lib/api';
import { MarkdownEditor } from '@/components/admin/MarkdownEditor';

interface EditArticleFormProps {
  assetId: string;
  initialAsset: KnowledgeAsset;
  categories: Awaited<ReturnType<typeof listAdminCategories>>;
  tags: Awaited<ReturnType<typeof listTags>>;
  concepts: Awaited<ReturnType<typeof listConcepts>>;
  versions: AssetVersion[];
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  REVIEW: 'In Review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

export function EditArticleForm({
  assetId,
  initialAsset,
  categories,
  tags,
  concepts,
  versions,
}: EditArticleFormProps) {
  const [asset, setAsset] = useState(initialAsset);
  const [title, setTitle] = useState(initialAsset.title);
  const [summary, setSummary] = useState(initialAsset.summary || '');
  const [content, setContent] = useState(initialAsset.rawContent || '');
  const [contentType, setContentType] = useState(initialAsset.contentType || 'tutorial');
  const [categoryId, setCategoryId] = useState(initialAsset.categoryId || '');
  const [difficulty, setDifficulty] = useState(initialAsset.difficulty || 'beginner');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const handleSave = useCallback(
    async (currentContent?: string) => {
      setError(null);
      setLoading(true);
      try {
        const updateData: Parameters<typeof updateAdminAsset>[1] = {
          title,
          rawContent: currentContent ?? content,
          contentType,
          difficulty,
          tags: selectedTags,
        };
        if (summary) updateData.summary = summary;
        if (categoryId) updateData.categoryId = categoryId;
        const updated = await updateAdminAsset(assetId, updateData);
        setAsset(updated);
        return updated;
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message || 'Failed to save article');
        } else {
          setError('An unexpected error occurred');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [assetId, title, summary, content, contentType, categoryId, difficulty, selectedTags],
  );

  const handleAutoSave = useCallback(
    async (newContent: string) => {
      await handleSave(newContent);
    },
    [handleSave],
  );

  const toggleTag = (tagSlug: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagSlug) ? prev.filter((t) => t !== tagSlug) : [...prev, tagSlug],
    );
  };

  const handleLifecycleAction = async (
    action: () => Promise<KnowledgeAsset>,
    actionName: string,
  ) => {
    setError(null);
    setLoading(true);
    try {
      const updated = await action();
      setAsset(updated);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`Failed to ${actionName}: ${err.message}`);
      } else {
        setError(`An unexpected error occurred while ${actionName}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (
      !confirm(
        'Are you sure you want to restore this version? The current content will be saved as a new version.',
      )
    ) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await restoreAssetVersion(assetId, versionId);
      setAsset(updated);
      setContent(updated.rawContent || '');
      setShowVersions(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(`Failed to restore version: ${err.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Articles
          </Link>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              asset.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-800'
                : asset.status === 'REVIEW'
                  ? 'bg-yellow-100 text-yellow-800'
                  : asset.status === 'ARCHIVED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {STATUS_LABELS[asset.status] || asset.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowVersions(!showVersions)}
            className="btn-secondary"
          >
            {showVersions ? 'Hide' : 'Show'} Versions ({versions.length})
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field mt-1"
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Summary
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="input-field mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              onSave={handleAutoSave}
              autoSaveInterval={30000}
            />
            <p className="mt-1 text-xs text-gray-500">Content auto-saves every 30 seconds.</p>
          </div>

          {showVersions && versions.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900 mb-4">Version History</h3>
              <ul className="divide-y">
                {versions.map((version, idx) => (
                  <li key={version.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Version {versions.length - idx}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                        {version.gitSha && ` • ${version.gitSha.slice(0, 7)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(version.id)}
                        className="text-sm text-brand-600 hover:text-brand-700"
                      >
                        Restore
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Article Settings</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
                  Content Type
                </label>
                <select
                  id="contentType"
                  value={contentType || 'tutorial'}
                  onChange={(e) => setContentType(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="tutorial">Tutorial</option>
                  <option value="guide">Guide</option>
                  <option value="reference">Reference</option>
                  <option value="explanation">Explanation</option>
                  <option value="article">Article</option>
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty || 'beginner'}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedTags.includes(tag.slug)
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="font-medium text-gray-900 mb-2">Concepts</h3>
            <div className="space-y-2">
              {concepts.items.slice(0, 10).map((concept) => (
                <label key={concept.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedConcepts.includes(concept.id)}
                    onChange={() => {
                      setSelectedConcepts((prev) =>
                        prev.includes(concept.id)
                          ? prev.filter((c) => c !== concept.id)
                          : [...prev, concept.id],
                      );
                    }}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span className="text-sm text-gray-700">{concept.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Lifecycle Actions</h3>
            <div className="space-y-2">
              {asset.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() =>
                    handleLifecycleAction(() => submitAssetForReview(assetId), 'submit for review')
                  }
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  Submit for Review
                </button>
              )}
              {asset.status === 'REVIEW' && (
                <button
                  type="button"
                  onClick={() => handleLifecycleAction(() => approveAsset(assetId), 'approve')}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  Approve
                </button>
              )}
              {asset.status === 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleLifecycleAction(() => publishAsset(assetId), 'publish')}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  Publish
                </button>
              )}
              {asset.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleLifecycleAction(() => archiveAsset(assetId), 'archive')}
                  disabled={loading}
                  className="btn-secondary w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  Archive
                </button>
              )}
              {asset.status === 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => handleLifecycleAction(() => restoreAsset(assetId), 'restore')}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
