import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { updateCoupon, deleteCoupon } from '@/features/commerce/store';
import type { Coupon } from '@/features/commerce/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Partial<Coupon> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const coupon = await updateCoupon(id, body);
  if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ coupon });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const deleted = await deleteCoupon(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
