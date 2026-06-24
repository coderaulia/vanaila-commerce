import { NextResponse } from 'next/server';

import { assertAdminRequest } from '@/features/cms/adminAuth';
import { generateMfaSetup } from '@/features/cms/mfa';

export async function POST(request: Request) {
  const auth = await assertAdminRequest(request);
  if (auth instanceof NextResponse) return auth;
  const session = auth;

  const { secret, otpauthUrl } = generateMfaSetup(session.user.email);
  return NextResponse.json({ secret, otpauthUrl });
}
