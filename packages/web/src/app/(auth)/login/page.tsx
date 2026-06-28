import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/components/auth/AuthForms';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Log in',
  description: 'Sign in to your Knowledge Base Central account.',
  path: '/login',
});

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Log in</h1>
      <p className="mb-6 text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-brand-600 hover:underline">
          Register
        </Link>
      </p>
      <div className="card">
        <LoginForm />
      </div>
    </div>
  );
}
