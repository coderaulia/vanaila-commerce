import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { queryProducts } from '@/features/commerce/store';
import { assertRateLimit } from '@/services/requestSecurity';

export async function GET(request: Request) {
  const rl = await assertRateLimit(request, 'store-products', 120, 60_000);
  if (rl) return rl;

  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const featuredParam = searchParams.get('featured');
  const rawQ = searchParams.get('q') ?? '';
  const q = rawQ.trim().slice(0, 200) || undefined;
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('pageSize') ?? '12', 10) || 12));
  const featured = featuredParam === 'true' ? true : featuredParam === 'false' ? false : undefined;

  const payload = await queryProducts({ status: 'active', categoryId, featured, q, page, pageSize });
  return NextResponse.json(payload);
}
