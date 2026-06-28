'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createAdminAsset, listAdminCategories } from '@/lib/admin-api';
import { listTags } from '@/lib/api';
import { MarkdownEditor } from '@/components/admin/MarkdownEditor';
import { ApiClientError } from '@/lib/api';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [contentType, setContentType] = useState('article');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<{ slug: string; name: string }[]>([]);

  useState(() => {
    listAdminCategories()
      .then(setCategories)
      .catch(() => {});
    listTags()
      .then(setAllTags)
      .catch(() => {});
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const createData: Parameters<typeof createAdminAsset>[0] = {
        title,
        rawContent,
        contentType,
        difficulty,
        tags,
      };
      if (summary) createData.summary = summary;
      if (categoryId) createData.categoryId = categoryId;
      const asset = await createAdminAsset(createData);
      router.push(`/admin/articles/${asset.id}/edit`);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError('Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (slug: string) => {
    setTags((prev) => (prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]));
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/articles" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Articles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Create New Article</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
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
                rows={3}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <MarkdownEditor value={rawContent} onChange={setRawContent} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Article Settings</h3>
              <div>
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">
                  Content Type
                </label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="article">Article</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="guide">Guide</option>
                  <option value="reference">Reference</option>
                  <option value="explanation">Explanation</option>
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
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
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    onClick={() => toggleTag(tag.slug)}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${tags.includes(tag.slug) ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating...' : 'Create Article'}
              </button>
              <Link href="/admin/articles" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
