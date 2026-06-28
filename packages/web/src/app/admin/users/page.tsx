'use client';

import { useEffect, useState } from 'react';
import { listAdminUsers } from '@/lib/admin-api';
import type { AdminUser } from '@/lib/admin-api';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Note: The API currently only exposes GET /users. Role/status updates would require additional backend endpoints.
  // For now, the UI is prepared for those actions once the endpoints are added.

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Users</h1>

      {error && <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.username}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          user.role === 'OWNER'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'EDITOR'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
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
