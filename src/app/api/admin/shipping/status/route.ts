import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { env } from '@/services/env';

export async function GET(request: Request) {
  const auth = await assertAdminPermission(request, 'settings:edit');
  if ('error' in auth) return auth.error;

  return NextResponse.json({
    configured: Boolean(env.rajaOngkirApiKey && env.shippingOriginId),
    hasApiKey: Boolean(env.rajaOngkirApiKey),
    hasOriginId: Boolean(env.shippingOriginId),
    couriers: env.shippingCouriers,
    defaultWeightGrams: env.shippingDefaultWeightGrams,
    freeThreshold: env.shippingFreeThreshold,
    baseUrl: env.rajaOngkirBaseUrl
  });
}
