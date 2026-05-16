import { randomUUID } from 'node:crypto';

import { getDb } from '@/db/client';
import { orderItemsTable, ordersTable, productVariantsTable, couponsTable, customersTable } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

import type { CheckoutPayload, Order, OrderItem } from './types';
import { adjustStock, getOrCreateCustomer, getCouponByCode } from './store';
import { createOrderReceiptToken } from './orderReceipt';

const nowIso = () => new Date().toISOString();
const MAX_CHECKOUT_QUANTITY = 99;

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export type CheckoutResult = {
  order: Order;
  items: OrderItem[];
  receiptToken: string;
  paymentUrl?: string;
};

export async function processCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const db = getDb();
  const now = nowIso();

  if (
    payload.items.length === 0 ||
    payload.items.some((item) => !item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_CHECKOUT_QUANTITY)
  ) {
    throw new Error('Invalid checkout items');
  }

  // 1. Resolve customer
  const customer = await getOrCreateCustomer(payload.customer);

  // 2. Resolve variants and calculate totals
  const variantIds = payload.items.map((i) => i.variantId);
  const variants = await db
    .select()
    .from(productVariantsTable)
    .where(sql`${productVariantsTable.id} = ANY(${variantIds})`);

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  let subtotal = 0;
  const orderItems: Array<{
    id: string;
    productId: string;
    variantId: string;
    productTitle: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  for (const item of payload.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) throw new Error(`Variant ${item.variantId} not found`);
    if (Number(variant.stock) < item.quantity) {
      throw new Error(`Insufficient stock for ${variant.name} (SKU: ${variant.sku})`);
    }

    const unitPrice = Number(variant.price);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    orderItems.push({
      id: randomUUID(),
      productId: variant.productId,
      variantId: variant.id,
      productTitle: variant.name,
      variantName: variant.name,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice,
      totalPrice
    });
  }

  // 3. Apply coupon if provided
  let discount = 0;
  let couponId: string | null = null;

  if (payload.couponCode) {
    const coupon = await getCouponByCode(payload.couponCode);
    if (coupon && coupon.active) {
      const now = new Date();
      const validStart = !coupon.startsAt || new Date(coupon.startsAt) <= now;
      const validEnd = !coupon.expiresAt || new Date(coupon.expiresAt) >= now;
      const validUses = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
      const validMin = coupon.minOrderAmount === null || subtotal >= coupon.minOrderAmount;

      if (validStart && validEnd && validUses && validMin) {
        couponId = coupon.id;
        if (coupon.type === 'percentage') {
          discount = Math.round((subtotal * coupon.value) / 100);
        } else {
          discount = Math.min(coupon.value, subtotal);
        }

        // Increment used count
        await db
          .update(couponsTable)
          .set({ usedCount: sql`${couponsTable.usedCount} + 1` })
          .where(eq(couponsTable.id, coupon.id));
      }
    }
  }

  const total = subtotal - discount;
  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();

  // 4. Create order
  const orderRow = {
    id: orderId,
    orderNumber,
    customerId: customer.id,
    status: 'pending_payment' as const,
    paymentMethod: payload.paymentMethod,
    paymentStatus: 'pending' as const,
    paymentReference: null,
    subtotal: String(subtotal),
    discount: String(discount),
    shippingCost: '0',
    total: String(total),
    couponId,
    shippingName: payload.customer.name,
    shippingPhone: payload.customer.phone,
    shippingAddress: payload.customer.address,
    shippingCity: payload.customer.city,
    shippingProvince: payload.customer.province,
    shippingPostalCode: payload.customer.postalCode,
    notes: payload.notes || '',
    createdAt: now,
    updatedAt: now
  };

  await db.insert(ordersTable).values(orderRow);

  // 5. Create order items
  const itemRows = orderItems.map((item) => ({
    ...item,
    orderId,
    unitPrice: String(item.unitPrice),
    totalPrice: String(item.totalPrice)
  }));
  await db.insert(orderItemsTable).values(itemRows);

  // 6. Deduct stock
  for (const item of payload.items) {
    const variant = variantMap.get(item.variantId)!;
    const newStock = Number(variant.stock) - item.quantity;
    await adjustStock(item.variantId, newStock, 'order_placed', orderId);
  }

  // 7. Update customer stats
  await db
    .update(customersTable)
    .set({
      totalOrders: sql`${customersTable.totalOrders} + 1`,
      totalSpent: sql`${customersTable.totalSpent} + ${total}`,
      updatedAt: now
    })
    .where(eq(customersTable.id, customer.id));

  const order: Order = {
    id: orderId,
    orderNumber,
    customerId: customer.id,
    status: 'pending_payment',
    paymentMethod: payload.paymentMethod,
    paymentStatus: 'pending',
    paymentReference: null,
    subtotal,
    discount,
    shippingCost: 0,
    total,
    couponId,
    shippingName: payload.customer.name,
    shippingPhone: payload.customer.phone,
    shippingAddress: payload.customer.address,
    shippingCity: payload.customer.city,
    shippingProvince: payload.customer.province,
    shippingPostalCode: payload.customer.postalCode,
    notes: payload.notes || '',
    createdAt: now,
    updatedAt: now,
    items: orderItems.map((i) => ({ ...i, orderId }))
  };

  const receiptToken = createOrderReceiptToken(order);

  // 8. Payment processing
  let paymentUrl: string | undefined;
  if (payload.paymentMethod === 'midtrans') {
    paymentUrl = await createMidtransTransaction(orderId, orderNumber, total, receiptToken, payload.customer);
  }

  return { order, items: order.items!, receiptToken, paymentUrl };
}

// ─── Midtrans Integration ───────────────────────────────────────────────────

async function createMidtransTransaction(
  orderId: string,
  orderNumber: string,
  total: number,
  receiptToken: string,
  customer: { name: string; email: string; phone: string }
): Promise<string | undefined> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
  if (!serverKey) return undefined;

  const isProduction = process.env.MIDTRANS_PRODUCTION === 'true';
  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  const body = {
    transaction_details: {
      order_id: orderNumber,
      gross_amount: Math.round(total)
    },
    customer_details: {
      first_name: customer.name,
      email: customer.email,
      phone: customer.phone
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_SITE_URL}/shop/order/${orderId}?status=finish&token=${encodeURIComponent(receiptToken)}`
    }
  };

  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) return undefined;
    const data = (await res.json()) as { redirect_url?: string };
    return data.redirect_url;
  } catch {
    return undefined;
  }
}
