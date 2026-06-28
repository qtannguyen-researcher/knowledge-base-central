'use client';

import { useEffect, useState } from 'react';
import {
  listAdminReferences,
  createAdminReference,
  updateAdminReference,
  deleteAdminReference,
} from '@/lib/admin-api';
import type { Reference as AdminReference } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

export default function ReferencesPage() {
  const [references, setReferences] = useState<AdminReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminReference | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [url, setUrl] = useState('');
  const [doi, setDoi] = useState('');
  const [type, setType] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await listAdminReferences(1, 50);
      setReferences(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load references');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setTitle('');
    setSlug('');
    setAuthors('');
    setYear('');
    setUrl('');
    setDoi('');
    setType('');
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (ref: AdminReference) => {
    setEditing(ref);
    setTitle(ref.title);
    setSlug(ref.slug);
    setAuthors(ref.authors?.join(', ') || '');
    setYear(ref.year?.toString() || '');
    setUrl(ref.url || '');
    setDoi(ref.doi || '');
    setType(ref.type || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data: Parameters<typeof createAdminReference>[0] = { title };
      if (slug) data.slug = slug;
      if (authors)
        data.authors = authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      if (year) data.year = parseInt(year, 10);
      if (url) data.url = url;
      if (doi) data.doi = doi;
      if (type) data.type = type;
      if (editing) {
        await updateAdminReference(editing.id, data);
      } else {
        await createAdminReference(data);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save reference');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ref: AdminReference) => {
    if (!confirm(`Delete reference "${ref.title}"?`)) return;
    try {
      await deleteAdminReference(ref.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete reference');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">References</h1>
        <button onClick={startCreate} className="btn-primary">
          New Reference
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit Reference' : 'Create Reference'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() =>
                    setSlug(
                      title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, ''),
                    )
                  }
                  required
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Authors (comma separated)
                </label>
                <input
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field mt-1"
                  min="1900"
                  max="2100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">DOI</label>
                <input
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input-field mt-1"
                >
                  <option value="">Select type</option>
                  <option value="article">Article</option>
                  <option value="book">Book</option>
                  <option value="paper">Paper</option>
                  <option value="website">Website</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Authors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {references.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No references yet.
                  </td>
                </tr>
              ) : (
                references.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{ref.title}</span>
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-brand-600 hover:underline text-sm"
                        >
                          ↗
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {ref.authors?.join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ref.year || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ref.type || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(ref)}
                        className="text-brand-600 hover:text-brand-700 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ref)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
