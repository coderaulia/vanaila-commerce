'use client';

import { FormEvent, useEffect, useState } from 'react';
import { csrfFetch } from '@/lib/clientCsrf';

type MfaStatus = { enabled: boolean; backupCodesRemaining: number };
type SetupStep = 'idle' | 'setup' | 'confirm' | 'backup-codes';

export default function SecurityPage() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>('idle');

  // Setup state
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedBackupCodes, setSavedBackupCodes] = useState(false);

  // Disable state
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  async function fetchMfaStatus() {
    try {
      const response = await csrfFetch('/api/admin/auth/mfa/status', { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        setMfaStatus(await response.json() as MfaStatus);
      }
    } catch {
      // ignore
    }
  }

  const handleBeginSetup = async () => {
    setPending(true);
    setError('');
    try {
      const response = await csrfFetch('/api/admin/auth/mfa/setup', { method: 'POST' });
      if (!response.ok) { setError('Failed to start setup.'); return; }
      const data = await response.json() as { secret: string; otpauthUrl: string };
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setSetupStep('setup');
    } catch { setError('Something went wrong.'); }
    finally { setPending(false); }
  };

  const handleConfirmSetup = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await csrfFetch('/api/admin/auth/mfa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code: confirmCode.trim() })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setError(payload?.error ?? 'Invalid code. Please try again.');
        return;
      }
      const data = await response.json() as { backupCodes: string[] };
      setBackupCodes(data.backupCodes);
      setSetupStep('backup-codes');
      await fetchMfaStatus();
    } catch { setError('Something went wrong.'); }
    finally { setPending(false); }
  };

  const handleDisableMfa = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await csrfFetch('/api/admin/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        setError(payload?.error ?? 'Failed to disable MFA.');
        return;
      }
      setSuccess('Two-factor authentication has been disabled.');
      setShowDisableForm(false);
      setDisablePassword('');
      await fetchMfaStatus();
    } catch { setError('Something went wrong.'); }
    finally { setPending(false); }
  };

  return (
    <div className="admin-page">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-display font-black text-deepSlate mb-2">Security</h1>
        <p className="admin-subtle mb-8">Manage two-factor authentication for your admin account.</p>

        {success ? <p className="mb-4" style={{ color: 'green' }}>{success}</p> : null}
        {error ? <p className="error mb-4">{error}</p> : null}

        <div className="admin-card">
          <div className="admin-inline-header mb-4">
            <h2 className="text-lg font-semibold">Two-Factor Authentication (TOTP)</h2>
            {mfaStatus?.enabled ? (
              <span className="admin-chip" style={{ background: '#d1fae5', color: '#065f46' }}>Enabled</span>
            ) : (
              <span className="admin-chip admin-chip-muted">Disabled</span>
            )}
          </div>

          {setupStep === 'idle' && !mfaStatus?.enabled && (
            <>
              <p className="admin-subtle mb-4">
                Add an extra layer of security. After enabling, you&apos;ll need your authenticator app each time you sign in.
              </p>
              <button type="button" onClick={handleBeginSetup} disabled={pending}>
                {pending ? 'Loading...' : 'Enable Two-Factor Authentication'}
              </button>
            </>
          )}

          {setupStep === 'setup' && (
            <div>
              <p className="admin-subtle mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm.
              </p>
              <div className="admin-card mb-4" style={{ background: '#f9f9f9' }}>
                <p className="text-xs font-mono break-all mb-2">{otpauthUrl}</p>
                <p className="admin-subtle text-xs">Copy this URL into your authenticator app if you cannot scan a QR code.</p>
                <p className="admin-subtle text-xs mt-2">Secret key: <span className="font-mono">{secret}</span></p>
              </div>
              <form className="admin-form-wrap" onSubmit={handleConfirmSetup}>
                <label htmlFor="confirmCode">
                  6-Digit Code from App
                  <input
                    id="confirmCode"
                    type="text"
                    inputMode="numeric"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    maxLength={6}
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </label>
                <button type="submit" disabled={pending}>
                  {pending ? 'Verifying...' : 'Confirm & Enable'}
                </button>
              </form>
              <button type="button" className="admin-subtle underline mt-3 bg-transparent border-0 cursor-pointer" onClick={() => setSetupStep('idle')}>
                Cancel
              </button>
            </div>
          )}

          {setupStep === 'backup-codes' && (
            <div>
              <p className="font-semibold mb-2">Save your backup codes</p>
              <p className="admin-subtle mb-4">
                Store these codes somewhere safe. Each code can be used once if you lose access to your authenticator app.
              </p>
              <div className="admin-card" style={{ background: '#f9f9f9' }}>
                <ul className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code) => (
                    <li key={code} className="font-mono text-sm">{code}</li>
                  ))}
                </ul>
              </div>
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input type="checkbox" checked={savedBackupCodes} onChange={(e) => setSavedBackupCodes(e.target.checked)} />
                <span className="admin-subtle">I have saved my backup codes</span>
              </label>
              <button
                type="button"
                disabled={!savedBackupCodes}
                onClick={() => { setSetupStep('idle'); setSuccess('Two-factor authentication is now enabled.'); }}
                className="mt-4"
              >
                Done
              </button>
            </div>
          )}

          {mfaStatus?.enabled && setupStep === 'idle' && (
            <div>
              <p className="admin-subtle mb-2">
                Two-factor authentication is active. Backup codes remaining: <strong>{mfaStatus.backupCodesRemaining}</strong>
              </p>
              {!showDisableForm ? (
                <button type="button" onClick={() => setShowDisableForm(true)} style={{ background: '#fee2e2', color: '#991b1b' }}>
                  Disable Two-Factor Authentication
                </button>
              ) : (
                <form className="admin-form-wrap mt-4" onSubmit={handleDisableMfa}>
                  <label htmlFor="disablePassword">
                    Confirm your password to disable MFA
                    <input
                      id="disablePassword"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      autoFocus
                    />
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" disabled={pending} style={{ background: '#fee2e2', color: '#991b1b' }}>
                      {pending ? 'Disabling...' : 'Confirm Disable'}
                    </button>
                    <button type="button" onClick={() => { setShowDisableForm(false); setDisablePassword(''); setError(''); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
