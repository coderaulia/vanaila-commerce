import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { getProductBySlug } from '@/features/commerce/store';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
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
