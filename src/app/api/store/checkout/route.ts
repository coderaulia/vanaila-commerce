import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { processCheckout } from '@/features/commerce/checkout';
import { sendOrderConfirmationEmail } from '@/features/commerce/orderEmail';
import type { CheckoutPayload } from '@/features/commerce/types';

export async function POST(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutPayload | null;
  if (!body || !body.items?.length || !body.customer?.email || !body.paymentMethod) {
    return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
  }

  // Basic validation
  if (!body.customer.name || !body.customer.phone || !body.customer.address) {
    return NextResponse.json({ error: 'Missing required customer fields' }, { status: 400 });
  }

  try {
    const result = await processCheckout(body);

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(result.order, result.items, body.customer.email).catch(() => {});

    return NextResponse.json({
      order: result.order,
      paymentUrl: result.paymentUrl
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
