import { NextResponse } from 'next/server';

import { assertRateLimit, assertTrustedMutationRequest, assertCsrfToken } from '@/services/requestSecurity';
import { elevateSessionWithMfa, getAdminSession } from '@/features/cms/adminAuth';

export async function POST(request: Request) {
  const originFailure = assertTrustedMutationRequest(request);
  if (originFailure) return originFailure;

  const csrfFailure = assertCsrfToken(request);
  if (csrfFailure) return csrfFailure;

  const rl = await assertRateLimit(request, 'admin-verify-mfa', 10, 60_000);
  if (rl) return rl;

  // Allow access even when mfaRequired — that's the whole point of this endpoint
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.mfaRequired) {
    return NextResponse.json({ error: 'MFA verification not required.' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim() ?? '';

  if (!code) {
    return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
  }

  const elevated = await elevateSessionWithMfa(request, code);
  if (!elevated) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: session.user });
}
