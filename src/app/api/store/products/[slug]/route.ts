import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { getProductBySlug } from '@/features/commerce/store';
import { assertRateLimit } from '@/services/requestSecurity';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const rl = await assertRateLimit(request, 'store-product-detail', 120, 60_000);
  if (rl) return rl;

  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const { slug } = await context.params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ product });
}
