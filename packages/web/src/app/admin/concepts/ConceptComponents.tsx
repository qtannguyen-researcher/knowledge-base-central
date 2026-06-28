'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Concept, PaginatedResponse } from '@/lib/api.types';
import {
  listAdminConcepts,
  createAdminConcept,
  updateAdminConcept,
  deleteAdminConcept,
} from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

interface ConceptFormProps {
  editConcept?: Concept | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ConceptForm({ editConcept, onSuccess, onCancel }: ConceptFormProps) {
  const [name, setName] = useState(editConcept?.name || '');
  const [slug, setSlug] = useState(editConcept?.slug || '');
  const [aliases, setAliases] = useState(editConcept?.aliases?.join(', ') || '');
  const [description, setDescription] = useState(editConcept?.description || '');
  const [domain, setDomain] = useState(editConcept?.domain || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: Parameters<typeof createAdminConcept>[0] = { name };
      if (slug) data.slug = slug;
      if (aliases)
        data.aliases = aliases
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
      if (description) data.description = description;
      if (domain) data.domain = domain;

      if (editConcept) {
        await updateAdminConcept(editConcept.id, data);
      } else {
        await createAdminConcept(data);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to save concept');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    if (!editConcept) {
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
          disabled={!!editConcept}
        />
      </div>

      <div>
        <label htmlFor="aliases" className="block text-sm font-medium text-gray-700">
          Aliases
        </label>
        <input
          type="text"
          id="aliases"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          className="input-field mt-1"
          placeholder="Comma-separated aliases"
        />
      </div>

      <div>
        <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
          Domain
        </label>
        <input
          type="text"
          id="domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="input-field mt-1"
          placeholder="e.g., Mathematics, Computer Science"
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

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : editConcept ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

interface ConceptManagerProps {
  initialConcepts: PaginatedResponse<Concept>;
}

export function ConceptManager({ initialConcepts }: ConceptManagerProps) {
  const router = useRouter();
  const [concepts, setConcepts] = useState(initialConcepts.items);
  const [total, setTotal] = useState(initialConcepts.total);
  const [page, setPage] = useState(initialConcepts.page);
  const [showForm, setShowForm] = useState(false);
  const [editConcept, setEditConcept] = useState<Concept | null>(null);

  const loadPage = async (newPage: number) => {
    const result = await listAdminConcepts(newPage, 20);
    setConcepts(result.items);
    setTotal(result.total);
    setPage(newPage);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditConcept(null);
    router.refresh();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditConcept(null);
  };

  const handleDelete = async (concept: Concept) => {
    if (!confirm(`Are you sure you want to delete "${concept.name}"?`)) return;

    try {
      await deleteAdminConcept(concept.id);
      router.refresh();
    } catch {
      alert('Failed to delete concept.');
    }
  };

  return (
    <div>
      {showForm ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editConcept ? 'Edit Concept' : 'Create New Concept'}
          </h2>
          <ConceptForm
            editConcept={editConcept}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Concepts ({total})</h2>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              New Concept
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Aliases
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {concepts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No concepts yet
                  </td>
                </tr>
              ) : (
                concepts.map((concept) => (
                  <tr key={concept.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">{concept.name}</td>
                    <td className="px-6 py-4 text-gray-500">{concept.domain || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {concept.aliases?.join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditConcept(concept);
                          setShowForm(true);
                        }}
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
          {total > 20 && (
            <div className="flex justify-center gap-2 p-4">
              {page > 1 && (
                <button onClick={() => loadPage(page - 1)} className="btn-secondary">
                  Previous
                </button>
              )}
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              {page * 20 < total && (
                <button onClick={() => loadPage(page + 1)} className="btn-secondary">
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
