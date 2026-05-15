import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { createVariant, deleteVariant, updateVariant } from '@/features/commerce/store';
import type { ProductVariant } from '@/features/commerce/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Partial<ProductVariant> | null;

  const variant = await createVariant({ ...body, productId: id });
  return NextResponse.json({ variant }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { id: string } & Partial<ProductVariant> | null;
  if (!body?.id) return NextResponse.json({ error: 'Missing variant id' }, { status: 400 });

  const variant = await updateVariant(body.id, body);
  if (!variant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ variant });
}

export async function DELETE(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const variantId = searchParams.get('variantId');
  if (!variantId) return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });

  const deleted = await deleteVariant(variantId);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
