import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { getDb } from '@/db/client';
import { productVariantsTable } from '@/db/schema';
import {
  estimateOrderWeightGrams,
  quoteShippingCosts
} from '@/features/commerce/shipping';
import { getSettings } from '@/features/cms/contentStore';
import { env } from '@/services/env';
import { assertRateLimit } from '@/services/requestSecurity';

const MAX_ITEMS = 100;
const MAX_QUANTITY = 99;

function normalizeItems(value: unknown): Array<{ variantId: string; quantity: number }> | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) return null;

  const byVariant = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const variantId = String(record.variantId ?? '').trim();
    const quantity = Number(record.quantity);
    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
    byVariant.set(variantId, (byVariant.get(variantId) ?? 0) + quantity);
  }

  const items = [...byVariant.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  return items.some((item) => item.quantity > MAX_QUANTITY) ? null : items;
}

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const rateLimitFailure = await assertRateLimit(request, 'shipping-quotes', 30, 60_000);
  if (rateLimitFailure) return rateLimitFailure;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const destinationId = String(body?.destinationId ?? '').trim();
  const items = normalizeItems(body?.items);
  if (!destinationId || !items) {
    return NextResponse.json({ error: 'Invalid shipping quote payload' }, { status: 400 });
  }

  const db = getDb();
  const variantIds = items.map((item) => item.variantId);
  const variants = await db
    .select()
    .from(productVariantsTable)
    .where(inArray(productVariantsTable.id, variantIds));
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  if (items.some((item) => !variantMap.has(item.variantId))) {
    return NextResponse.json({ error: 'One or more cart items are unavailable' }, { status: 400 });
  }

  const subtotal = items.reduce((sum, item) => {
    const variant = variantMap.get(item.variantId)!;
    return sum + Number(variant.price) * item.quantity;
  }, 0);
  const weightGrams = estimateOrderWeightGrams(
    items.map((item) => ({ quantity: item.quantity, variant: variantMap.get(item.variantId)! }))
  );

  const [quotes, settings] = await Promise.all([
    quoteShippingCosts({
      originId: env.shippingOriginId,
      destinationId,
      weightGrams
    }),
    getSettings()
  ]);
  const freeThreshold = settings.store.freeShippingThreshold > 0 ? settings.store.freeShippingThreshold : null;
  const normalizedQuotes =
    freeThreshold && subtotal >= freeThreshold
      ? quotes.map((quote) => ({ ...quote, cost: 0, description: quote.description || 'Free shipping promo' }))
      : quotes;

  return NextResponse.json({
    quotes: normalizedQuotes,
    meta: {
      configured: Boolean(env.rajaOngkirApiKey && env.shippingOriginId),
      subtotal,
      weightGrams,
      freeShippingApplied: Boolean(freeThreshold && subtotal >= freeThreshold)
    }
  });
}
