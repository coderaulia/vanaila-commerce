import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { getCoupons, createCoupon } from '@/features/commerce/store';
import type { Coupon } from '@/features/commerce/types';

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const coupons = await getCoupons();
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as Partial<Coupon> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const coupon = await createCoupon(body);
  return NextResponse.json({ coupon }, { status: 201 });
}
