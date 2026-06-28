'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Reference as AdminReference } from '@/lib/admin-api';
import {
  listAdminReferences,
  createAdminReference,
  updateAdminReference,
  deleteAdminReference,
} from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

interface ReferenceFormProps {
  editReference?: AdminReference | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReferenceForm({ editReference, onSuccess, onCancel }: ReferenceFormProps) {
  const [title, setTitle] = useState(editReference?.title || '');
  const [slug, setSlug] = useState(editReference?.slug || '');
  const [authors, setAuthors] = useState(editReference?.authors?.join(', ') || '');
  const [year, setYear] = useState(editReference?.year?.toString() || '');
  const [url, setUrl] = useState(editReference?.url || '');
  const [doi, setDoi] = useState(editReference?.doi || '');
  const [type, setType] = useState(editReference?.type || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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

      if (editReference) {
        await updateAdminReference(editReference.id, data);
      } else {
        await createAdminReference(data);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to save reference');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = () => {
    if (!editReference) {
      const generated = title
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={generateSlug}
          required
          className="input-field mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="authors" className="block text-sm font-medium text-gray-700">
            Authors
          </label>
          <input
            type="text"
            id="authors"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            className="input-field mt-1"
            placeholder="Comma-separated names"
          />
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input-field mt-1"
            min="1900"
            max="2100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-field mt-1"
            placeholder="https://..."
          />
        </div>

        <div>
          <label htmlFor="doi" className="block text-sm font-medium text-gray-700">
            DOI
          </label>
          <input
            type="text"
            id="doi"
            value={doi}
            onChange={(e) => setDoi(e.target.value)}
            className="input-field mt-1"
            placeholder="10.xxxx/xxxxx"
          />
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-field mt-1"
        >
          <option value="">Select type</option>
          <option value="article">Article</option>
          <option value="book">Book</option>
          <option value="website">Website</option>
          <option value="paper">Paper</option>
          <option value="video">Video</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : editReference ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

interface ReferenceManagerProps {
  initialReferences: { items: AdminReference[]; total: number };
}

export function ReferenceManager({ initialReferences }: ReferenceManagerProps) {
  const router = useRouter();
  const [references, setReferences] = useState(initialReferences.items);
  const [total, setTotal] = useState(initialReferences.total);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editReference, setEditReference] = useState<AdminReference | null>(null);

  const loadPage = async (newPage: number) => {
    const result = await listAdminReferences(newPage, 20);
    setReferences(result.items);
    setTotal(result.total);
    setPage(newPage);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditReference(null);
    router.refresh();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditReference(null);
  };

  const handleDelete = async (ref: AdminReference) => {
    if (!confirm(`Are you sure you want to delete "${ref.title}"?`)) return;

    try {
      await deleteAdminReference(ref.id);
      router.refresh();
    } catch {
      alert('Failed to delete reference.');
    }
  };

  return (
    <div>
      {showForm ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editReference ? 'Edit Reference' : 'Create New Reference'}
          </h2>
          <ReferenceForm
            editReference={editReference}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">References ({total})</h2>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              New Reference
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Authors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {references.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No references yet
                  </td>
                </tr>
              ) : (
                references.map((ref) => (
                  <tr key={ref.id}>
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
                    <td className="px-6 py-4 text-gray-500">{ref.authors?.join(', ') || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{ref.year || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{ref.type || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditReference(ref);
                          setShowForm(true);
                        }}
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
