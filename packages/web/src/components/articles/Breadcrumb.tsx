import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-gray-400" aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-brand-600">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'font-medium text-gray-900' : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
