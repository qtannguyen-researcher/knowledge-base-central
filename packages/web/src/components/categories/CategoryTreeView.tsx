'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { CategoryNode } from '@/lib/api.types';

interface CategoryTreeViewProps {
  categories: CategoryNode[];
}

function TreeNode({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  const hasChildren = node.children.length > 0;
  const [expanded, setExpanded] = useState(depth < 2);

  return (
    <li className="py-1">
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
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
          <span className="w-6" aria-hidden />
        )}
        <Link
          href={`/categories/${node.slug}`}
          className="font-medium text-brand-600 hover:underline"
        >
          {node.name}
        </Link>
        {node.description && <span className="text-sm text-gray-500">— {node.description}</span>}
      </div>
      {hasChildren && expanded && (
        <ul className="ml-6 mt-1 border-l border-gray-200 pl-4">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CategoryTreeView({ categories }: CategoryTreeViewProps) {
  return (
    <ul className="space-y-1" role="tree" aria-label="Category hierarchy">
      {categories.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </ul>
  );
}
