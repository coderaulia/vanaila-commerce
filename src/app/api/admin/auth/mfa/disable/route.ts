import { NextResponse } from 'next/server';

import { assertAdminRequest, verifyAdminPassword } from '@/features/cms/adminAuth';
import { disableMfa, getMfaStatus } from '@/features/cms/mfa';

export async function POST(request: Request) {
  const auth = await assertAdminRequest(request);
  if (auth instanceof NextResponse) return auth;
  const session = auth;

  // Require MFA to already be verified in this session — prevents disabling MFA with only a stolen password
  if (session.mfaRequired) {
    return NextResponse.json({ error: 'mfa_required' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = body?.password?.trim() ?? '';

  if (!password) {
    return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
  }

  const passwordValid = await verifyAdminPassword(session.user.id, password);
  if (!passwordValid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const status = await getMfaStatus(session.user.id);
  if (!status.enabled) {
    return NextResponse.json({ error: 'MFA is not enabled.' }, { status: 409 });
  }

  await disableMfa(session.user.id);
  return NextResponse.json({ ok: true });
}
