import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { loginCustomer, setSessionCookie } from '@/features/commerce/customerAuth';
import { assertRateLimit, assertTrustedMutationRequest } from '@/services/requestSecurity';

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const blocked = assertTrustedMutationRequest(request);
  if (blocked) return blocked;

  const limited = await assertRateLimit(request, 'account:login', 10, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const email = typeof raw.email === 'string' ? raw.email.trim().slice(0, 254) : '';
  const password = typeof raw.password === 'string' ? raw.password.slice(0, 1000) : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const result = await loginCustomer(email, password);

  if (result === 'invalid_credentials') {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const res = NextResponse.json({ customer: result.customer });
  setSessionCookie(res, result.sessionToken, result.expiresAt);
  return res;
}
