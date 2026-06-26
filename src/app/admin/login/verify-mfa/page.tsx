'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { csrfFetch } from '@/lib/clientCsrf';
import { primeAdminSession } from '@/features/cms/adminClientAuth';
import type { AdminSessionUser } from '@/features/cms/adminTypes';

function VerifyMfaContent() {
  const router = useRouter();
  const params = useSearchParams();
  const nextHref = params.get('next') ?? '/admin';

  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const response = await csrfFetch('/api/admin/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? 'Invalid code. Please try again.');
        return;
      }

      const payload = (await response.json()) as { user: AdminSessionUser };
      primeAdminSession(payload.user);
      router.replace(nextHref);
      router.refresh();
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
          <h1 className="text-3xl font-display font-black text-deepSlate mb-3">Two-Factor Authentication</h1>
          <p className="admin-subtle mb-8">
            {useBackup
              ? 'Enter one of your backup codes to sign in.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>
          <form className="admin-form-wrap" onSubmit={handleSubmit}>
            <label htmlFor="code">
              {useBackup ? 'Backup Code' : 'Authenticator Code'}
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode={useBackup ? 'text' : 'numeric'}
                placeholder={useBackup ? 'e.g. a1b2c3d4' : '000000'}
                maxLength={useBackup ? 8 : 6}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={pending}>
              {pending ? 'Verifying...' : 'Verify'}
            </button>
          </form>
          {error ? <p className="error mt-3">{error}</p> : null}
          <p className="admin-subtle mt-4">
            <button
              type="button"
              className="underline bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => { setUseBackup(!useBackup); setCode(''); setError(''); }}
            >
              {useBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
            </button>
          </p>
          <p className="admin-subtle mt-2">
            <Link href="/admin/login" className="underline">
              Back to login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default function VerifyMfaPage() {
  return (
    <Suspense>
      <VerifyMfaContent />
    </Suspense>
  );
}
