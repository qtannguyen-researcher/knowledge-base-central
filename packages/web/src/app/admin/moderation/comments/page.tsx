'use client';

import { useEffect, useState } from 'react';
import { listPendingComments, approveComment, rejectComment } from '@/lib/admin-api';
import type { Comment } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

export default function CommentModerationPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const result = await listPendingComments(p, 20);
      setComments(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await approveComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to approve comment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this comment?')) return;
    setProcessing(id);
    try {
      await rejectComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to reject comment');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Comment Moderation</h1>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending comments.</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {comment.asset?.title || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {comment.author?.displayName || comment.author?.username || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-xs truncate">{comment.content}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleApprove(comment.id)}
                        disabled={processing === comment.id}
                        className="text-green-600 hover:text-green-700 mr-4 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(comment.id)}
                        disabled={processing === comment.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 20 && (
              <div className="flex justify-center gap-2 p-4">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
