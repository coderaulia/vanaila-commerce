import { NextResponse } from 'next/server';

import { clearSessionCookie, logoutCustomer } from '@/features/commerce/customerAuth';
import { assertTrustedMutationRequest } from '@/services/requestSecurity';

export async function POST(request: Request) {
  const blocked = assertTrustedMutationRequest(request);
  if (blocked) return blocked;

  await logoutCustomer();
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
