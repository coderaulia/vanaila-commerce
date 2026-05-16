import { NextResponse } from 'next/server';

import { clearSessionCookie, logoutCustomer } from '@/features/commerce/customerAuth';

export async function POST() {
  await logoutCustomer();
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
