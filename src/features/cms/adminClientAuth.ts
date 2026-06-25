import { csrfFetch } from '@/lib/clientCsrf';

import type {
  AdminAuthResponse,
  AdminErrorResponse,
  AdminLoginPayload,
  AdminSessionUser
} from './adminTypes';

export type AdminLoginResult = { user: AdminSessionUser | null; error: string | null; mfaRequired?: boolean };

let cachedSessionUser: AdminSessionUser | null | undefined;
let sessionRequest: Promise<AdminSessionUser | null> | null = null;
let mfaRedirectNeeded = false;

export function getCachedAdminSession() {
  return cachedSessionUser;
}

export function isMfaRedirectNeeded() {
  return mfaRedirectNeeded;
}

export function primeAdminSession(user: AdminSessionUser | null) {
  cachedSessionUser = user;
  mfaRedirectNeeded = false;
}

export async function getAdminSession(force = false): Promise<AdminSessionUser | null> {
  if (!force && cachedSessionUser !== undefined) {
    return cachedSessionUser;
  }

  if (!force && sessionRequest) {
    return sessionRequest;
  }

  sessionRequest = csrfFetch('/api/admin/auth', {
    method: 'GET',
    cache: 'no-store'
  })
    .then(async (response) => {
      if (response.status === 403) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (payload?.error === 'mfa_required') {
          mfaRedirectNeeded = true;
          cachedSessionUser = null;
          return null;
        }
      }

      if (!response.ok) {
        mfaRedirectNeeded = false;
        cachedSessionUser = null;
        return null;
      }

      mfaRedirectNeeded = false;
      const payload = (await response.json()) as AdminAuthResponse;
      cachedSessionUser = payload.user;
      return payload.user;
    })
    .catch(() => {
      cachedSessionUser = null;
      return null;
    })
    .finally(() => {
      sessionRequest = null;
    });

  return sessionRequest;
}

export async function loginAdmin(input: AdminLoginPayload): Promise<AdminLoginResult> {
  const response = await csrfFetch('/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as AdminErrorResponse | null;
    cachedSessionUser = null;
    return { user: null, error: payload?.error || 'Unable to sign in.' };
  }

  const payload = (await response.json()) as AdminAuthResponse & { mfaRequired?: boolean };
  if (payload.mfaRequired) {
    // Don't cache the user yet — MFA verification is still required
    return { user: payload.user, error: null, mfaRequired: true };
  }

  cachedSessionUser = payload.user;
  return { user: payload.user, error: null };
}

export async function logoutAdmin() {
  await csrfFetch('/api/admin/auth', {
    method: 'DELETE'
  });
  cachedSessionUser = null;
}

export async function logoutAllDevices(): Promise<{ error: string | null }> {
  const response = await csrfFetch('/api/admin/auth/logout-all', {
    method: 'POST'
  });
  cachedSessionUser = null;
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: payload?.error ?? 'Failed to sign out all devices.' };
  }
  return { error: null };
}