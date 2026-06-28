'use client';

interface HighlightTextProps {
  text: string;
  query: string;
}

export function HighlightText({ text, query }: HighlightTextProps) {
  if (!query.trim() || !text) {
    return <>{text}</>;
  }

  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
