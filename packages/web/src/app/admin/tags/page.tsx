'use client';

import { useEffect, useState } from 'react';
import { listAdminTags, createAdminTag, updateAdminTag, deleteAdminTag } from '@/lib/admin-api';
import type { Tag } from '@/lib/api.types';
import { ApiClientError } from '@/lib/api';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAdminTags();
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
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
    setName('');
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (tag: Tag) => {
    setEditing(tag);
    setName(tag.name);
    setSlug(tag.slug);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data: Parameters<typeof createAdminTag>[0] = { name };
      if (slug) data.slug = slug;
      if (editing) {
        await updateAdminTag(editing.id, data);
      } else {
        await createAdminTag(data);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    try {
      await deleteAdminTag(tag.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete tag');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
        <button onClick={startCreate} className="btn-primary">
          New Tag
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit Tag' : 'Create Tag'}
          </h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field flex-1"
              placeholder="Tag name"
            />
            {!editing && (
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input-field flex-1"
                placeholder="Slug (auto-generated if empty)"
              />
            )}
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Articles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tags.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No tags yet.
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{tag.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tag.assetCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(tag)}
                        className="text-brand-600 hover:text-brand-700 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
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
