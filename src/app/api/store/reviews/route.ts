import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { createProductReview, getProductById } from '@/features/commerce/store';
import { assertRateLimit } from '@/services/requestSecurity';

const MAX = {
  productId: 128,
  authorName: 128,
  authorEmail: 254,
  body: 2000
};

function cap(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  const authorName = cap(raw.authorName, MAX.authorName);
  const authorEmail = cap(raw.authorEmail, MAX.authorEmail).toLowerCase();
  const body = cap(raw.body, MAX.body);
  const rating = Number(raw.rating);

  if (!productId || !authorName || !isEmail(authorEmail) || !body || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const review = await createProductReview({
    productId,
    authorName,
    authorEmail,
    rating,
    body
  });

  return NextResponse.json({ review }, { status: 201 });
}
