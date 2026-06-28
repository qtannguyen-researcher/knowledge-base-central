'use client';

import { useEffect, useState } from 'react';
import {
  listCorrections,
  startReviewCorrection,
  acceptCorrection,
  rejectCorrection,
  implementCorrection,
} from '@/lib/admin-api';
import type { CorrectionRequest } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

type Tab = 'ALL' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED';

export default function CorrectionQueuePage() {
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>('ALL');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CorrectionRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = async (p = 1, status?: string) => {
    setLoading(true);
    try {
      const result = await listCorrections(p, 20, status);
      setCorrections(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, tab === 'ALL' ? undefined : tab);
    setSelected(null);
  }, [tab]);

  const handleAction = async (id: string, action: 'review' | 'accept' | 'reject' | 'implement') => {
    setProcessing(id);
    setError(null);
    try {
      switch (action) {
        case 'review':
          await startReviewCorrection(id);
          break;
        case 'accept':
          await acceptCorrection(id);
          break;
        case 'reject': {
          if (!rejectionReason.trim()) {
            setError('Please provide a reason for rejection');
            setProcessing(null);
            return;
          }
          await rejectCorrection(id, rejectionReason);
          setRejectionReason('');
          break;
        }
        case 'implement':
          await implementCorrection(id);
          break;
      }
      await load(page, tab === 'ALL' ? undefined : tab);
      setSelected(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : `Failed to ${action}`);
    } finally {
      setProcessing(null);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'IMPLEMENTED', label: 'Implemented' },
  ];

  const STATUS_COLOR: Record<string, string> = {
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    IMPLEMENTED: 'bg-purple-100 text-purple-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Correction Requests</h1>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : corrections.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No corrections found.</div>
            ) : (
              <ul className="divide-y">
                {corrections.map((correction) => (
                  <li
                    key={correction.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(correction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[correction.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {correction.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(correction.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{correction.description}</p>
                    {correction.asset && (
                      <p className="text-sm text-gray-500 mt-1">
                        Article: {correction.asset.title}
                      </p>
                    )}
                    {correction.submitter && (
                      <p className="text-sm text-gray-500 mt-1">
                        By: {correction.submitter.displayName || correction.submitter.username}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          {selected ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Detail</h3>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLOR[selected.status] || 'bg-gray-100 text-gray-800'}`}
                >
                  {selected.status}
                </span>
              </div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900 mt-1">{selected.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Suggestion</dt>
                  <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded mt-1">
                    {selected.suggestion}
                  </dd>
                </div>
                {selected.asset && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Linked Article</dt>
                    <dd className="text-sm text-brand-600">{selected.asset.title}</dd>
                  </div>
                )}
                <div className="pt-4 border-t space-y-2">
                  {selected.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleAction(selected.id, 'review')}
                      disabled={processing === selected.id}
                      className="btn-secondary w-full"
                    >
                      {processing === selected.id ? 'Starting...' : 'Start Review'}
                    </button>
                  )}
                  {(selected.status === 'SUBMITTED' || selected.status === 'UNDER_REVIEW') && (
                    <>
                      <button
                        onClick={() => handleAction(selected.id, 'accept')}
                        disabled={processing === selected.id}
                        className="btn-primary w-full"
                      >
                        {processing === selected.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(selected.id, 'reject')}
                        disabled={processing === selected.id}
                        className="btn-secondary w-full border-red-300 text-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {selected.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleAction(selected.id, 'implement')}
                      disabled={processing === selected.id}
                      className="btn-primary w-full"
                    >
                      {processing === selected.id ? 'Implementing...' : 'Mark Implemented'}
                    </button>
                  )}
                </div>
                {(selected.status === 'SUBMITTED' || selected.status === 'UNDER_REVIEW') && (
                  <div className="mt-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="input-field w-full"
                      rows={3}
                    />
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              Select a correction to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
