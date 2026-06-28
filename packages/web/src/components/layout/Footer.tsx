import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Knowledge Base Central</h2>
            <p className="mt-2 text-sm text-gray-600">
              A centralized platform to capture, organize, and connect knowledge.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <h3 className="text-sm font-semibold text-gray-900">Browse</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/articles" className="text-gray-600 hover:text-brand-600">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-brand-600">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/tags" className="text-gray-600 hover:text-brand-600">
                  Tags
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="text-gray-600 hover:text-brand-600">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-600 hover:text-brand-600">
                  Search
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Account links">
            <h3 className="text-sm font-semibold text-gray-900">Account</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-brand-600">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-brand-600">
                  Register
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Knowledge Base Central. Open by default.
        </p>
      </div>
    </footer>
  );
}
