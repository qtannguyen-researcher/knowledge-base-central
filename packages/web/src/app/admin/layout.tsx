import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/api';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const serverCookies = cookieStore.toString();

  let user = null;
  try {
    user = await getCurrentUser({ serverCookies });
  } catch {
    redirect('/login');
  }

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'CONTRIBUTOR') {
    redirect('/');
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/articles', label: 'Articles', icon: '📝' },
    { href: '/admin/categories', label: 'Categories', icon: '📁' },
    { href: '/admin/tags', label: 'Tags', icon: '🏷️' },
    { href: '/admin/concepts', label: 'Concepts', icon: '💡' },
    { href: '/admin/references', label: 'References', icon: '📚' },
    { href: '/admin/learning-paths', label: 'Learning Paths', icon: '🛤️' },
    { href: '/admin/git-sync', label: 'Git Sync', icon: '🔄' },
    { href: '/admin/moderation/comments', label: 'Comments', icon: '💬' },
    { href: '/admin/moderation/corrections', label: 'Corrections', icon: '✏️' },
    { href: '/admin/audit', label: 'Audit Log', icon: '📋' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-white shadow-lg">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin/dashboard" className="text-xl font-bold text-brand-600">
            Admin Portal
          </Link>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 border-t bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-sm font-medium text-brand-600">
                {user.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
