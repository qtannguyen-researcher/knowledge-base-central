'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import type { CategoryNode } from '@/lib/api.types';

interface CategorySidebarProps {
  categories: CategoryNode[];
}

function CategoryTreeNode({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  const pathname = usePathname();
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(depth < 1);
  const isActive = pathname === `/categories/${node.slug}`;

  return (
    <li>
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <button
            type="button"
            className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
            aria-expanded={expanded}
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            onClick={() => setExpanded((e) => !e)}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              {expanded ? (
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </button>
        ) : (
          <span className="w-5" aria-hidden />
        )}
        <Link
          href={`/categories/${node.slug}`}
          className={`flex-1 rounded px-2 py-1 text-sm ${
            isActive ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {node.name}
        </Link>
      </div>
      {hasChildren && expanded && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2">
          {node.children.map((child) => (
            <CategoryTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategorySidebar({ categories }: CategorySidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const tree = (
    <nav aria-label="Category navigation">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Categories</h2>
      <ul className="space-y-1">
        {categories.map((node) => (
          <CategoryTreeNode key={node.id} node={node} />
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        className="mb-4 flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 lg:hidden"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((o) => !o)}
      >
        Browse categories
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <aside className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
        <div className="card sticky top-20">{tree}</div>
      </aside>
    </>
  );
}
