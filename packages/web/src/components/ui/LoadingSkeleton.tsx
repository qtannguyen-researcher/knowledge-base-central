export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading content">
      <div className="h-8 w-2/3 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-5/6 rounded bg-gray-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
