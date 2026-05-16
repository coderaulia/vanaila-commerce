import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { getProductCategories, createProductCategory } from '@/features/commerce/store';
import type { ProductCategory } from '@/features/commerce/types';

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const categories = await getProductCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as Partial<ProductCategory> | null;
  if (!body?.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const category = await createProductCategory(body);
  return NextResponse.json({ category }, { status: 201 });
}
