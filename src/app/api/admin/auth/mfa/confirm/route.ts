import { NextResponse } from 'next/server';

import { assertAdminRequest } from '@/features/cms/adminAuth';
import { enableMfa, getMfaStatus } from '@/features/cms/mfa';

export async function POST(request: Request) {
  const auth = await assertAdminRequest(request);
  if (auth instanceof NextResponse) return auth;
  const session = auth;

  const body = (await request.json().catch(() => null)) as { secret?: string; code?: string } | null;
  const secret = body?.secret?.trim() ?? '';
  const code = body?.code?.trim() ?? '';

  if (!secret || !code) {
    return NextResponse.json({ error: 'Secret and code are required.' }, { status: 400 });
  }

  const status = await getMfaStatus(session.user.id);
  if (status.enabled) {
    return NextResponse.json({ error: 'MFA is already enabled.' }, { status: 409 });
  }

  const backupCodes = await enableMfa(session.user.id, secret, code);
  if (!backupCodes) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, backupCodes });
}
