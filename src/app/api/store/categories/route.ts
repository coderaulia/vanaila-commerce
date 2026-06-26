import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { getProductCategories } from '@/features/commerce/store';
import { assertRateLimit } from '@/services/requestSecurity';

export async function GET(request: Request) {
  const rl = await assertRateLimit(request, 'store-categories', 120, 60_000);
  if (rl) return rl;

  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const categories = await getProductCategories();
  return NextResponse.json({ categories });
}
