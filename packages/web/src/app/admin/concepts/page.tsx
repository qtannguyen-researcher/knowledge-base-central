'use client';

import { useEffect, useState } from 'react';
import {
  listAdminConcepts,
  createAdminConcept,
  updateAdminConcept,
  deleteAdminConcept,
} from '@/lib/admin-api';
import type { Concept } from '@/lib/api.types';
import { ApiClientError } from '@/lib/api';

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Concept | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [aliases, setAliases] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await listAdminConcepts(1, 100);
      setConcepts(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concepts');
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
    setAliases('');
    setDomain('');
    setDescription('');
    setError(null);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (concept: Concept) => {
    setEditing(concept);
    setName(concept.name);
    setSlug(concept.slug);
    setAliases(concept.aliases?.join(', ') || '');
    setDomain(concept.domain || '');
    setDescription(concept.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data: Parameters<typeof createAdminConcept>[0] = { name };
      if (slug) data.slug = slug;
      if (aliases)
        data.aliases = aliases
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      if (domain) data.domain = domain;
      if (description) data.description = description;
      if (editing) {
        await updateAdminConcept(editing.id, data);
      } else {
        await createAdminConcept(data);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save concept');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (concept: Concept) => {
    if (!confirm(`Delete concept "${concept.name}"?`)) return;
    try {
      await deleteAdminConcept(concept.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to delete concept');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Concepts</h1>
        <button onClick={startCreate} className="btn-primary">
          New Concept
        </button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit Concept' : 'Create Concept'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() =>
                    setSlug(
                      name
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
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Domain</label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="input-field mt-1"
                  placeholder="e.g. Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aliases (comma separated)
                </label>
                <input
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
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
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Aliases
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {concepts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No concepts yet.
                  </td>
                </tr>
              ) : (
                concepts.map((concept) => (
                  <tr key={concept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{concept.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{concept.domain || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {concept.aliases?.join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(concept)}
                        className="text-brand-600 hover:text-brand-700 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(concept)}
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
