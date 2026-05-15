import { NextResponse } from 'next/server';

import {
  assertAdminRequest,
  clearAdminSessionCookie,
  logAdminAuditEvent,
  logoutAllAdminSessions
} from '@/features/cms/adminAuth';
import { assertCsrfToken, assertTrustedMutationRequest } from '@/services/requestSecurity';

export async function POST(request: Request) {
  const originFailure = assertTrustedMutationRequest(request);
  if (originFailure) return originFailure;

  const csrfFailure = assertCsrfToken(request);
  if (csrfFailure) return csrfFailure;

  const auth = await assertAdminRequest(request);
  if (auth instanceof NextResponse) return auth;

  const session = auth;
  await logoutAllAdminSessions(session.user.id);

  try {
    await logAdminAuditEvent(request, {
      action: 'admin.logout_all',
      entityType: 'auth',
      userId: session.user.id
    });
  } catch {
    // swallow audit log failures
  }

  const response = NextResponse.json({ ok: true });
  return clearAdminSessionCookie(response);
}
