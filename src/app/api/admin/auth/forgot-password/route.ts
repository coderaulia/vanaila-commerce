import { NextResponse } from 'next/server';

import { assertRateLimit, assertTrustedMutationRequest } from '@/services/requestSecurity';
import { createPasswordResetToken } from '@/features/cms/passwordReset';

export async function POST(request: Request) {
  const originFailure = assertTrustedMutationRequest(request);
  if (originFailure) return originFailure;

  const rl = await assertRateLimit(request, 'admin-forgot-password', 5, 15 * 60_000);
  if (rl) return rl;

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email ?? '';

  // Always return ok — never reveal if the email exists
  await createPasswordResetToken(email);
  return NextResponse.json({ ok: true });
}
