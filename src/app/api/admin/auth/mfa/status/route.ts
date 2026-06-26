import { NextResponse } from 'next/server';

import { assertAdminRequest } from '@/features/cms/adminAuth';
import { getMfaStatus } from '@/features/cms/mfa';

export async function GET(request: Request) {
  const auth = await assertAdminRequest(request);
  if (auth instanceof NextResponse) return auth;
  const session = auth;

  const status = await getMfaStatus(session.user.id);
  return NextResponse.json(status);
}
