'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

import { csrfFetch } from '@/lib/clientCsrf';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      await csrfFetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="admin-page">
      <section className="max-w-xl mx-auto px-6 py-20">
        <div className="admin-card admin-login">
          <h1 className="text-3xl font-display font-black text-deepSlate mb-3">Reset Password</h1>
          {submitted ? (
            <>
              <p className="admin-subtle mb-6">
                If that email is registered, a reset link has been sent. Check your inbox and follow the link within 1 hour.
              </p>
              <Link href="/admin/login" className="admin-subtle underline">
                Back to login
              </Link>
            </>
          ) : (
            <>
              <p className="admin-subtle mb-8">Enter your admin email address and we&apos;ll send you a password reset link.</p>
              <form className="admin-form-wrap" onSubmit={handleSubmit}>
                <label htmlFor="email">
                  Email
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </label>
                <button type="submit" disabled={pending}>
                  {pending ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
              {error ? <p className="error mt-3">{error}</p> : null}
              <p className="admin-subtle mt-6">
                <Link href="/admin/login" className="underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
