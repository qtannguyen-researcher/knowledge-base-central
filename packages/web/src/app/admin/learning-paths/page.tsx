'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listAdminLearningPaths,
  createAdminLearningPath,
  updateAdminLearningPath,
  deleteAdminLearningPath,
} from '@/lib/admin-api';
import type { LearningPath } from '@/lib/api.types';
import { ApiClientError } from '@/lib/api';

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LearningPath | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAdminLearningPaths();
      setPaths(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning paths');
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
    setDescription('');
    setDifficulty('beginner');
    setDuration('');
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (path: LearningPath) => {
    setEditing(path);
    setTitle(path.title);
    setSlug(path.slug);
    setDescription(path.description || '');
    setDifficulty(path.difficulty || 'beginner');
    setDuration(path.estimatedDuration?.toString() || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data: Parameters<typeof createAdminLearningPath>[0] = { title };
      if (slug) data.slug = slug;
      if (description) data.description = description;
      if (difficulty) data.difficulty = difficulty;
      if (duration) data.estimatedDuration = parseInt(duration, 10);
      if (editing) {
        await updateAdminLearningPath(editing.id, data);
      } else {
        await createAdminLearningPath(data);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save learning path');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (path: LearningPath) => {
    if (!confirm(`Delete learning path "${path.title}"?`)) return;
    try {
      await deleteAdminLearningPath(path.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete learning path');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
        <button onClick={startCreate} className="btn-primary">
          New Learning Path
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit Learning Path' : 'Create Learning Path'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select
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
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="input-field mt-1"
                  min="0"
                />
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
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paths.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No learning paths yet.
                  </td>
                </tr>
              ) : (
                paths.map((path) => (
                  <tr key={path.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link
                        href={`/admin/learning-paths/${path.id}`}
                        className="hover:text-brand-600"
                      >
                        {path.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{path.difficulty || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{path.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/learning-paths/${path.id}`}
                        className="text-brand-600 hover:text-brand-700 mr-4"
                      >
                        Edit Items
                      </Link>
                      <button
                        onClick={() => startEdit(path)}
                        className="text-brand-600 hover:text-brand-700 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(path)}
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
