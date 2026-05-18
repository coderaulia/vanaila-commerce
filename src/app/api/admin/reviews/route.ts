import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { assertAdminPermission, logAdminAuditEvent } from '@/features/cms/adminAuth';
import { queryProductReviews, updateProductReviewStatus } from '@/features/commerce/store';
import type { ProductReviewStatus } from '@/features/commerce/types';

const REVIEW_STATUSES = new Set<ProductReviewStatus>(['pending', 'approved', 'rejected']);

function parseStatus(value: string | null): 'all' | ProductReviewStatus {
  if (value === 'all') return 'all';
  return REVIEW_STATUSES.has(value as ProductReviewStatus) ? value as ProductReviewStatus : 'pending';
}

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = parseStatus(searchParams.get('status'));
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('pageSize') ?? '20', 10) || 20));

  const payload = await queryProductReviews({ status, page, pageSize });
  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { id?: string; status?: ProductReviewStatus } | null;
  if (!body?.id || !body.status || !REVIEW_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const review = await updateProductReviewStatus(body.id, body.status);
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    await logAdminAuditEvent(request, {
      action: 'product_review.update',
      entityType: 'product_review',
      entityId: review.id,
      userId: auth.session.user.id,
      metadata: { status: review.status, productId: review.productId }
    });
  } catch {
    // swallow
  }

  return NextResponse.json({ review });
}
