import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { updateProductCategory, deleteProductCategory } from '@/features/commerce/store';
import type { ProductCategory } from '@/features/commerce/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Partial<ProductCategory> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const category = await updateProductCategory(id, body);
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ category });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const deleted = await deleteProductCategory(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
