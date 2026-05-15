import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { getProductCategories } from '@/features/commerce/store';

export async function GET() {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const categories = await getProductCategories();
  return NextResponse.json({ categories });
}
