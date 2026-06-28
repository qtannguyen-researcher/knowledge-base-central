'use client';

import { useState } from 'react';
import type { CategoryNode } from '@/lib/api.types';
import { createAdminCategory, updateAdminCategory } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

interface CategoryFormProps {
  categories: CategoryNode[];
  editCategory?: CategoryNode | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ categories, editCategory, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(editCategory?.name || '');
  const [slug, setSlug] = useState(editCategory?.slug || '');
  const [description, setDescription] = useState(editCategory?.description || '');
  const [parentId, setParentId] = useState(editCategory?.id || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editCategory) {
        const updateData: Parameters<typeof updateAdminCategory>[1] = { name };
        if (slug) updateData.slug = slug;
        if (description) updateData.description = description;
        if (parentId) updateData.parentId = parentId;
        await updateAdminCategory(editCategory.id, updateData);
      } else {
        const createData: Parameters<typeof createAdminCategory>[0] = { name };
        if (slug) createData.slug = slug;
        if (description) createData.description = description;
        if (parentId) createData.parentId = parentId;
        await createAdminCategory(createData);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to save category');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
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
          placeholder="auto-generated-from-name"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input-field mt-1"
        />
      </div>

      <div>
        <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
          Parent Category
        </label>
        <select
          id="parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="input-field mt-1"
        >
          <option value="">No parent (root level)</option>
          {categories
            .filter((c) => c.id !== editCategory?.id)
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'—'.repeat(cat.depth)} {cat.name}
              </option>
            ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : editCategory ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

interface CategoryTreeViewProps {
  categories: CategoryNode[];
  onEdit: (category: CategoryNode) => void;
  onDelete: (category: CategoryNode) => void;
}

function CategoryTreeNode({
  category,
  onEdit,
  onDelete,
  hasChildren,
}: {
  category: CategoryNode;
  onEdit: (c: CategoryNode) => void;
  onDelete: (c: CategoryNode) => void;
  hasChildren: boolean;
}) {
  return (
    <li className="py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasChildren && <span className="text-gray-400">📁</span>}
          <span className="font-medium text-gray-900">{category.name}</span>
          <span className="text-sm text-gray-400">/{category.slug}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(category)}
            className="text-sm text-brand-600 hover:text-brand-700"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      {category.children.length > 0 && (
        <ul className="ml-8 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              hasChildren={child.children.length > 0}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTreeView({ categories, onEdit, onDelete }: CategoryTreeViewProps) {
  return (
    <ul className="divide-y">
      {categories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          hasChildren={category.children.length > 0}
        />
      ))}
    </ul>
  );
}
