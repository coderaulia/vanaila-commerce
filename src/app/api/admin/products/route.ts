import { NextResponse } from 'next/server';

import { assertAdminPermission, logAdminAuditEvent } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { queryProducts, createProduct } from '@/features/commerce/store';
import type { Product } from '@/features/commerce/types';

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') ?? 'all') as 'all' | 'draft' | 'active' | 'archived';
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '20');

  const payload = await queryProducts({ status, categoryId, q, page, pageSize });
  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as Partial<Product> | null;
  const product = await createProduct(body ?? {});

  try {
    await logAdminAuditEvent(request, {
      action: 'product.create',
      entityType: 'product',
      entityId: product.id,
      userId: auth.session.user.id,
      metadata: { title: product.title, slug: product.slug }
    });
  } catch {
    // swallow audit failures
  }

  return NextResponse.json({ product }, { status: 201 });
}
