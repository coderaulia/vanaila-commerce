import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { updatePaymentStatus } from '@/features/commerce/store';
import { getDb } from '@/db/client';
import { ordersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { assertRateLimit } from '@/services/requestSecurity';

type MidtransNotification = {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
};

export async function POST(request: Request) {
  const rl = await assertRateLimit(request, 'payment-webhook', 30, 60_000);
  if (rl) return rl;

  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as MidtransNotification | null;
  if (!body || !body.order_id || !body.signature_key) {
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
  }

  // Verify signature
  const expectedSignature = createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
    .digest('hex');

  if (body.signature_key !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  // Find order by order_number
  const db = getDb();
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, body.order_id))
    .limit(1);

  if (!orders[0]) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orders[0];

  // Idempotency: skip if already processed to prevent duplicate email sends on retries
  if (order.paymentStatus !== 'pending') {
    return NextResponse.json({ ok: true });
  }

  const orderId = order.id;

  // Map Midtrans status to our payment status
  const { transaction_status, fraud_status } = body;

  if (transaction_status === 'capture' || transaction_status === 'settlement') {
    if (fraud_status === 'accept' || !fraud_status) {
      await updatePaymentStatus(orderId, 'paid', body.order_id);
    }
  } else if (transaction_status === 'deny' || transaction_status === 'cancel') {
    await updatePaymentStatus(orderId, 'failed');
  } else if (transaction_status === 'expire') {
    await updatePaymentStatus(orderId, 'expired');
  } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
    await updatePaymentStatus(orderId, 'refunded');
  }

  return NextResponse.json({ ok: true });
}
