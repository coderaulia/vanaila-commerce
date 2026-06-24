import { NextResponse } from 'next/server';

import { assertRateLimit, assertTrustedMutationRequest } from '@/services/requestSecurity';
import { consumePasswordResetToken } from '@/features/cms/passwordReset';

export async function POST(request: Request) {
  const originFailure = assertTrustedMutationRequest(request);
  if (originFailure) return originFailure;

  const rl = await assertRateLimit(request, 'admin-reset-password', 10, 60_000);
  if (rl) return rl;

  const body = (await request.json().catch(() => null)) as { token?: string; newPassword?: string } | null;
  const token = body?.token ?? '';
  const newPassword = body?.newPassword ?? '';

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const ok = await consumePasswordResetToken(token, newPassword);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid or expired reset link. Please request a new one.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
