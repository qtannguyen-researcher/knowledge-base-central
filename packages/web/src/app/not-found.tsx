import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-900">Page not found</h2>
      <p className="mt-2 max-w-md text-gray-600">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
