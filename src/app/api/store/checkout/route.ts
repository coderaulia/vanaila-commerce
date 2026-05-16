import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { processCheckout } from '@/features/commerce/checkout';
import { sendOrderConfirmationEmail } from '@/features/commerce/orderEmail';
import { assertRateLimit } from '@/services/requestSecurity';
import type { CheckoutPayload } from '@/features/commerce/types';

// Field length caps — generous but bounded to prevent DB/log bloat
const MAX = {
  email: 254,
  name: 128,
  phone: 32,
  address: 512,
  city: 128,
  province: 128,
  postalCode: 16,
  couponCode: 64,
  notes: 1024
};

const MAX_ITEMS = 100;
const MAX_QUANTITY = 99;

function cap(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function asPaymentMethod(value: unknown): CheckoutPayload['paymentMethod'] | null {
  return value === 'midtrans' || value === 'manual_transfer' ? value : null;
}

function normalizeItems(value: unknown): CheckoutPayload['items'] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) {
    return null;
  }

  const items = value.map((item) => {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const variantId = String(record.variantId ?? '').trim();
    const quantity = Number(record.quantity);

    if (!variantId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return null;
    }

    return { variantId, quantity };
  });

  if (items.some((item) => item === null)) return null;
  return items as CheckoutPayload['items'];
}

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  // Rate limit: 10 checkout attempts per IP per minute
  const rateLimitFailure = await assertRateLimit(request, 'checkout', 10, 60_000);
  if (rateLimitFailure) return rateLimitFailure;

  const raw = (await request.json().catch(() => null)) as CheckoutPayload | null;
  if (!raw || !raw.items?.length || !raw.customer?.email || !raw.paymentMethod) {
    return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
  }

  const items = normalizeItems(raw.items);
  if (!items) {
    return NextResponse.json({ error: 'Invalid checkout items' }, { status: 400 });
  }
  const paymentMethod = asPaymentMethod(raw.paymentMethod);
  if (!paymentMethod) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  // Apply length caps to all string fields before any further processing
  const body: CheckoutPayload = {
    items,
    customer: {
      email: cap(raw.customer.email, MAX.email),
      name: cap(raw.customer.name, MAX.name),
      phone: cap(raw.customer.phone, MAX.phone),
      address: cap(raw.customer.address, MAX.address),
      city: cap(raw.customer.city, MAX.city),
      province: cap(raw.customer.province, MAX.province),
      postalCode: cap(raw.customer.postalCode, MAX.postalCode)
    },
    paymentMethod,
    couponCode: raw.couponCode ? cap(raw.couponCode, MAX.couponCode) : undefined,
    notes: raw.notes ? cap(raw.notes, MAX.notes) : undefined
  };

  if (!body.customer.name || !body.customer.phone || !body.customer.address) {
    return NextResponse.json({ error: 'Missing required customer fields' }, { status: 400 });
  }

  try {
    const result = await processCheckout(body);

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(result.order, result.items, body.customer.email).catch(() => {});

    return NextResponse.json({
      order: result.order,
      receiptToken: result.receiptToken,
      paymentUrl: result.paymentUrl
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
