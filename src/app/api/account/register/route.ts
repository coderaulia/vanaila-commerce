import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { registerCustomer, setSessionCookie } from '@/features/commerce/customerAuth';

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

  const { email, name, phone, password } = body as Record<string, string>;

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'email, name, and password are required' }, { status: 400 });
  }

  const result = await registerCustomer({ email, name, phone, password });

  if (result === 'email_taken') {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }
  if (result === 'weak_password') {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const res = NextResponse.json({ customer: result.customer });
  setSessionCookie(res, result.sessionToken, result.expiresAt);
  return res;
}
