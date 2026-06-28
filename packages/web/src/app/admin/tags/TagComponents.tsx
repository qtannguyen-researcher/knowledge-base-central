'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminTag, updateAdminTag, deleteAdminTag } from '@/lib/admin-api';
import type { Tag } from '@/lib/api.types';
import { ApiClientError } from '@/lib/api';

interface TagFormProps {
  editTag?: Tag | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TagForm({ editTag, onSuccess, onCancel }: TagFormProps) {
  const [name, setName] = useState(editTag?.name || '');
  const [slug, setSlug] = useState(editTag?.slug || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: Parameters<typeof createAdminTag>[0] = { name };
      if (slug) data.slug = slug;
      if (editTag) {
        await updateAdminTag(editTag.id, data);
      } else {
        await createAdminTag(data);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to save tag');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    if (!editTag) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={generateSlug}
          required
          className="input-field mt-1"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug
        </label>
        <input
          type="text"
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="input-field mt-1"
          disabled={!!editTag}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : editTag ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

interface TagManagerProps {
  initialTags: Tag[];
}

export function TagManager({ initialTags }: TagManagerProps) {
  const router = useRouter();
  const [tags] = useState(initialTags);
  const [showForm, setShowForm] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);

  const handleSuccess = () => {
    setShowForm(false);
    setEditTag(null);
    router.refresh();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditTag(null);
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) return;

    try {
      await deleteAdminTag(tag.id);
      router.refresh();
    } catch {
      alert('Failed to delete tag. It may be in use.');
    }
  };

  return (
    <div>
      {showForm ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editTag ? 'Edit Tag' : 'Create New Tag'}
          </h2>
          <TagForm editTag={editTag} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Tags</h2>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              New Tag
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Articles
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tags.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No tags yet
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{tag.name}</td>
                    <td className="px-6 py-4 text-gray-500">{tag.slug}</td>
                    <td className="px-6 py-4 text-gray-500">{tag.assetCount}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditTag(tag);
                          setShowForm(true);
                        }}
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
        </div>
      )}
    </div>
  );
}
