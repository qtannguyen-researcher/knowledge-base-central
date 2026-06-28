'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-gray-600">
        An unexpected error occurred while loading this page.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
