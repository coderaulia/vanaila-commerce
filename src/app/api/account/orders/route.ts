import { desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db/client';
import { orderItemsTable, ordersTable } from '@/db/schema';
import { getCustomerSession } from '@/features/commerce/customerAuth';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerId, session.id))
    .orderBy(desc(ordersTable.createdAt));

  if (orders.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orderIds = orders.map(o => o.id);
  const allItems = await db
    .select()
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds));

  const itemsByOrder = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const result = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    shippingName: order.shippingName,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingProvince: order.shippingProvince,
    notes: order.notes,
    createdAt: order.createdAt,
    items: (itemsByOrder.get(order.id) ?? []).map(item => ({
      id: item.id,
      productTitle: item.productTitle,
      variantName: item.variantName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }));

  return NextResponse.json({ orders: result });
}
