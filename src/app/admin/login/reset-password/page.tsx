'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { csrfFetch } from '@/lib/clientCsrf';

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setPending(true);
    try {
      const response = await csrfFetch('/api/admin/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? 'Failed to reset password. The link may have expired.');
        return;
      }

      router.replace('/admin/login?reset=1');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <main className="admin-page">
        <section className="max-w-xl mx-auto px-6 py-20">
          <div className="admin-card admin-login">
            <h1 className="text-3xl font-display font-black text-deepSlate mb-3">Invalid Link</h1>
            <p className="admin-subtle mb-6">This password reset link is invalid or has expired.</p>
            <Link href="/admin/login/forgot-password" className="underline admin-subtle">
              Request a new reset link
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="max-w-xl mx-auto px-6 py-20">
        <div className="admin-card admin-login">
          <h1 className="text-3xl font-display font-black text-deepSlate mb-3">Set New Password</h1>
          <p className="admin-subtle mb-8">Choose a new password for your admin account. Minimum 8 characters.</p>
          <form className="admin-form-wrap" onSubmit={handleSubmit}>
            <label htmlFor="newPassword">
              New Password
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                autoFocus
              />
            </label>
            <label htmlFor="confirmPassword">
              Confirm Password
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
            <button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Set new password'}
            </button>
          </form>
          {error ? <p className="error mt-3">{error}</p> : null}
          <p className="admin-subtle mt-6">
            <Link href="/admin/login/forgot-password" className="underline">
              Request a new link
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
