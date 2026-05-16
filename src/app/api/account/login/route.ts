import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { loginCustomer, setSessionCookie } from '@/features/commerce/customerAuth';

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password } = body as Record<string, string>;

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
