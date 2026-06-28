'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryTreeView, CategoryForm } from './CategoryComponents';
import { deleteAdminCategory } from '@/lib/admin-api';
import type { CategoryNode } from '@/lib/api.types';

interface CategoryManagerProps {
  initialCategories: CategoryNode[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const [categories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    setShowForm(false);
    setEditCategory(null);
    router.refresh();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditCategory(null);
  };

  const handleEdit = (category: CategoryNode) => {
    setEditCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category: CategoryNode) => {
    const hasChildren = category.children.length > 0;
    const message = hasChildren
      ? `This category has ${category.children.length} child categories. Are you sure you want to delete "${category.name}" and all its children?`
      : `Are you sure you want to delete "${category.name}"?`;

    if (!confirm(message)) return;

    try {
      await deleteAdminCategory(category.id);
      router.refresh();
    } catch (err) {
      setError('Failed to delete category. It may have linked articles.');
    }
  };

  const handleCreateNew = () => {
    setEditCategory(null);
    setShowForm(true);
  };

  return (
    <div>
      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showForm ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <CategoryForm
            categories={categories}
            editCategory={editCategory}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Category Tree</h2>
            <button onClick={handleCreateNew} className="btn-primary">
              New Category
            </button>
          </div>
          <div className="p-4">
            {categories.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No categories yet. Create your first category.
              </p>
            ) : (
              <CategoryTreeView
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
