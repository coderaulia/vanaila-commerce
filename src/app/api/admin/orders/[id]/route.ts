import { NextResponse } from 'next/server';

import { assertAdminPermission, getAdminSession, logAdminAuditEvent } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { getOrderById, updateOrderStatus, updatePaymentStatus } from '@/features/commerce/store';
import { sendOrderStatusEmail } from '@/features/commerce/orderEmail';
import { getCustomerById } from '@/features/commerce/store';
import type { OrderStatus, PaymentStatus } from '@/features/commerce/types';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ order });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:manage_orders');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentReference?: string;
  } | null;

  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  let order = null;

  if (body.paymentStatus) {
    order = await updatePaymentStatus(id, body.paymentStatus, body.paymentReference);
  }

  if (body.status) {
    order = await updateOrderStatus(id, body.status);
  }

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Send status email
  try {
    const customer = await getCustomerById(order.customerId);
    if (customer) {
      await sendOrderStatusEmail(order, customer.email);
    }
  } catch {
    // swallow email failures
  }

  try {
    await logAdminAuditEvent(request, {
      action: 'order.update',
      entityType: 'order',
      entityId: id,
      userId: auth.session.user.id,
      metadata: { status: order.status, paymentStatus: order.paymentStatus }
    });
  } catch {
    // swallow
  }

  return NextResponse.json({ order });
}
