'use client';

import { FormEvent, useState } from 'react';

import { login, register, ApiClientError } from '@/lib/api';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? '';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await login(email, password);
      const isAdmin = user.role === 'OWNER' || user.role === 'ADMIN' || user.role === 'MODERATOR';
      const destination = redirectTo ?? (isAdmin ? '/admin/dashboard' : '/');
      window.location.href = destination;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.code === 'invalid_credentials' ? 'Invalid email or password.' : err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const oauthBase = API_BASE || '';

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a href={`${oauthBase}/auth/github`} className="btn-secondary w-full text-center">
          GitHub
        </a>
        <a href={`${oauthBase}/auth/google`} className="btn-secondary w-full text-center">
          Google
        </a>
      </div>
    </div>
  );
}

interface RegisterFormProps {
  redirectTo?: string;
}

export function RegisterForm({ redirectTo = '/' }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!/^[a-zA-Z0-9]{3,30}$/.test(username)) {
      return 'Username must be 3–30 alphanumeric characters.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register(email, username, password);
      window.location.href = redirectTo;
    } catch (err) {
      if (err instanceof ApiClientError) {
        const messages: Record<string, string> = {
          email_taken: 'This email is already registered.',
          username_taken: 'This username is already taken.',
          validation_error: 'Please check your input and try again.',
        };
        setError(messages[err.code] ?? err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="register-username" className="mb-1 block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="register-username"
          type="text"
          required
          autoComplete="username"
          pattern="[a-zA-Z0-9]{3,30}"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="register-confirm" className="mb-1 block text-sm font-medium text-gray-700">
          Confirm password
        </label>
        <input
          id="register-confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field"
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
