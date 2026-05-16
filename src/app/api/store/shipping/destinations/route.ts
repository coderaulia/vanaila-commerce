import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { searchShippingDestinations } from '@/features/commerce/shipping';
import { assertRateLimit } from '@/services/requestSecurity';

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const rateLimitFailure = await assertRateLimit(request, 'shipping-destinations', 60, 60_000);
  if (rateLimitFailure) return rateLimitFailure;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().slice(0, 128);
  if (q.length < 3) return NextResponse.json({ destinations: [] });

  const destinations = await searchShippingDestinations(q);
  return NextResponse.json({ destinations });
}
