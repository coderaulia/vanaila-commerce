import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { getCustomerSession } from '@/features/commerce/customerAuth';
import { createProductReview, getProductById, hasCustomerPurchasedProduct } from '@/features/commerce/store';
import { assertRateLimit } from '@/services/requestSecurity';

const MAX = {
  productId: 128,
  body: 2000
};

function cap(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

async function assertReviewEligibility(productId: string) {
  const session = await getCustomerSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Please log in to review this product' }, { status: 401 })
    };
  }

  const purchased = await hasCustomerPurchasedProduct(session.id, productId);
  if (!purchased) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Only customers who purchased this product can review it' }, { status: 403 })
    };
  }

  return { ok: true as const, session };
}

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const productId = cap(searchParams.get('productId'), MAX.productId);
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

  const product = await getProductById(productId);
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const eligibility = await assertReviewEligibility(productId);
  if (!eligibility.ok) return eligibility.response;

  return NextResponse.json({ eligible: true });
}

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const limited = await assertRateLimit(request, 'store-review', 5, 60_000);
  if (limited) return limited;

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const productId = cap(raw.productId, MAX.productId);
  const body = cap(raw.body, MAX.body);
  const rating = Number(raw.rating);

  if (!productId || !body || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const eligibility = await assertReviewEligibility(productId);
  if (!eligibility.ok) return eligibility.response;

  const review = await createProductReview({
    productId,
    customerId: eligibility.session.id,
    authorName: eligibility.session.name,
    authorEmail: eligibility.session.email,
    rating,
    body
  });

  return NextResponse.json({ review }, { status: 201 });
}
