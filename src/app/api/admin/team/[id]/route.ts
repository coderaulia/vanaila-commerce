import { NextResponse } from 'next/server';

import { assertAdminPermission, logAdminAuditEvent, logoutAllAdminSessions } from '@/features/cms/adminAuth';
import { AdminTeamError, deleteAdminTeamMember, updateAdminTeamMember } from '@/features/cms/adminTeam';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  if (error instanceof AdminTeamError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: 'Failed to manage admin team.' }, { status: 500 });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await assertAdminPermission(request, 'team:manage');
  if ('error' in auth) return auth.error;
  const session = auth.session;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        displayName?: string;
        role?: string;
        password?: string;
      }
    | null;

  const passwordProvided = Boolean(body?.password?.trim());

  try {
    const member = await updateAdminTeamMember(
      id,
      {
        displayName: body?.displayName ?? '',
        role: body?.role ?? '',
        password: body?.password ?? ''
      },
      session?.user.id ?? null
    );

    if (passwordProvided) {
      try {
        await logoutAllAdminSessions(id);
      } catch {
        // swallow — password was already changed successfully
      }
    }

    try {
      await logAdminAuditEvent(request, {
        action: 'team.update',
        entityType: 'admin_user',
        entityId: member.id,
        userId: session.user.id,
        metadata: {
          email: member.email,
          role: member.role
        }
      });
    } catch {
      // swallow audit log failures
    }

    return NextResponse.json({ member });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await assertAdminPermission(request, 'team:manage');
  if ('error' in auth) return auth.error;
  const session = auth.session;

  const { id } = await params;

  try {
    const member = await deleteAdminTeamMember(id, session?.user.id ?? null);

    try {
      await logAdminAuditEvent(request, {
        action: 'team.delete',
        entityType: 'admin_user',
        entityId: member.id,
        userId: session.user.id,
        metadata: {
          email: member.email,
          role: member.role
        }
      });
    } catch {
      // swallow audit log failures
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
