import { NextResponse } from 'next/server';

import { assertAdminPermission, getAdminSession, logAdminAuditEvent } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { getProductById, updateProduct, deleteProduct } from '@/features/commerce/store';
import type { Product } from '@/features/commerce/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Partial<Product> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const product = await updateProduct(id, body);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await logAdminAuditEvent(request, {
      action: 'product.update',
      entityType: 'product',
      entityId: id,
      userId: auth.session.user.id,
      metadata: { title: product.title }
    });
  } catch {
    // swallow
  }

  return NextResponse.json({ product });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const deleted = await deleteProduct(id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await logAdminAuditEvent(request, {
      action: 'product.delete',
      entityType: 'product',
      entityId: id,
      userId: auth.session.user.id,
      metadata: {}
    });
  } catch {
    // swallow
  }

  return NextResponse.json({ ok: true });
}
