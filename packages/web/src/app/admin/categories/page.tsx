'use client';

import { useEffect, useState } from 'react';
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from '@/lib/admin-api';
import type { CategoryNode } from '@/lib/api.types';
import { ApiClientError } from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAdminCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
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
    setSlug('');
    setDescription('');
    setParentId('');
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (category: CategoryNode) => {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setParentId(category.parentId || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        const updateData: Parameters<typeof updateAdminCategory>[1] = { name };
        if (slug) updateData.slug = slug;
        if (description) updateData.description = description;
        if (parentId) updateData.parentId = parentId;
        await updateAdminCategory(editing.id, updateData);
      } else {
        const createData: Parameters<typeof createAdminCategory>[0] = { name };
        if (slug) createData.slug = slug;
        if (description) createData.description = description;
        if (parentId) createData.parentId = parentId;
        await createAdminCategory(createData);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: CategoryNode) => {
    if (
      !confirm(
        `Delete "${category.name}"${category.children.length ? ` and ${category.children.length} children` : ''}?`,
      )
    )
      return;
    try {
      await deleteAdminCategory(category.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete category');
    }
  };

  const generateSlug = () => {
    const generated = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={startCreate} className="btn-primary">
          New Category
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit Category' : 'Create Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={generateSlug}
                required
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Category</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="input-field mt-1"
              >
                <option value="">None</option>
                {categories
                  .filter((c) => c.id !== editing?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {'—'.repeat(c.depth)} {c.name}
                    </option>
                  ))}
              </select>
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
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Children
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories && categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div style={{ paddingLeft: `${category.depth * 16}px` }}>
                        <span className="font-medium text-gray-900">{category.name}</span>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
                    {category.children ? (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {category.children.length}
                      </td>
                    ) : (
                      <span></span>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(category)}
                        className="text-brand-600 hover:text-brand-700 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
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
