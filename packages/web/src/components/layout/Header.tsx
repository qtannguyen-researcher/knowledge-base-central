'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { SearchBar } from '@/components/search/SearchBar';

interface HeaderProps {
  user?: { username: string } | null;
}

export function Header({ user = null }: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeMobile]);

  const navLinks = [
    { href: '/articles', label: 'Articles' },
    { href: '/categories', label: 'Categories' },
    { href: '/tags', label: 'Tags' },
    { href: '/learning-paths', label: 'Learning Paths' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold text-brand-700"
          aria-label="Knowledge Base Central home"
        >
          KBC
        </Link>

        <nav className="hidden items-center gap-4 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-brand-600 ${
                pathname.startsWith(link.href) ? 'text-brand-600' : 'text-gray-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 md:block">
          <SearchBar className="max-w-md" />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <span className="hidden text-sm text-gray-600 sm:inline" aria-label="Signed in user">
              {user.username}
            </span>
          ) : (
            <>
              <Link href="/login" className="btn-secondary hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/register" className="btn-primary hidden sm:inline-flex">
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-4">
            <SearchBar />
          </div>
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={closeMobile}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={closeMobile}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md px-3 py-2 text-sm font-medium text-brand-600 hover:bg-gray-50"
                  onClick={closeMobile}
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
