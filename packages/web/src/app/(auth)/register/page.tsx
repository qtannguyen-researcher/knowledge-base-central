import type { Metadata } from 'next';
import Link from 'next/link';

import { RegisterForm } from '@/components/auth/AuthForms';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Register',
  description: 'Create a Knowledge Base Central account.',
  path: '/register',
});

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Create account</h1>
      <p className="mb-6 text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
      <div className="card">
        <RegisterForm />
      </div>
    </div>
  );
}
