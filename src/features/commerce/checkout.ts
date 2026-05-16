import { randomUUID } from 'node:crypto';

import { getDb } from '@/db/client';
import {
  couponsTable,
  customersTable,
  inventoryLogsTable,
  orderItemsTable,
  ordersTable,
  productVariantsTable
} from '@/db/schema';
import { env } from '@/services/env';
import { and, eq, sql } from 'drizzle-orm';

import type { StoreSettings } from '@/features/cms/types';

import type { CheckoutPayload, Order, OrderItem } from './types';
import { createOrderReceiptToken } from './orderReceipt';
import { estimateOrderWeightGrams, quoteShippingCosts } from './shipping';

const nowIso = () => new Date().toISOString();
const MAX_CHECKOUT_QUANTITY = 99;

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function normalizeCheckoutItems(items: CheckoutPayload['items']) {
  const byVariant = new Map<string, number>();

  for (const item of items) {
    if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return null;
    }
    byVariant.set(item.variantId, (byVariant.get(item.variantId) ?? 0) + item.quantity);
  }

  const normalized = [...byVariant.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  if (
    normalized.length === 0 ||
    normalized.some((item) => item.quantity < 1 || item.quantity > MAX_CHECKOUT_QUANTITY)
  ) {
    return null;
  }

  return normalized;
}

async function resolveSelectedShipping(input: {
  payload: CheckoutPayload;
  items: Array<{ variantId: string; quantity: number }>;
  variantMap: Map<string, { weight: unknown }>;
  subtotal: number;
  freeShippingThreshold?: number | null;
}): Promise<{ cost: number; note: string }> {
  const selection = input.payload.shipping;
  if (!selection?.destinationId || !selection.courierCode || !selection.serviceCode) {
    return { cost: 0, note: '' };
  }

  const weightGrams = estimateOrderWeightGrams(
    input.items.map((item) => ({
      quantity: item.quantity,
      variant: { weight: input.variantMap.get(item.variantId)?.weight as number | string | null }
    }))
  );
  const quotes = await quoteShippingCosts({
    originId: env.shippingOriginId,
    destinationId: selection.destinationId,
    weightGrams,
    couriers: [selection.courierCode]
  });
  const quote = quotes.find(
    (item) =>
      item.courierCode.toLowerCase() === selection.courierCode.toLowerCase() &&
      item.serviceCode.toLowerCase() === selection.serviceCode.toLowerCase()
  );

  if (!quote) {
    throw new Error('Selected shipping service is no longer available');
  }

  const freeThreshold = input.freeShippingThreshold && input.freeShippingThreshold > 0
    ? input.freeShippingThreshold
    : null;
  const cost = freeThreshold && input.subtotal >= freeThreshold ? 0 : quote.cost;
  const note = [
    `Shipping: ${quote.courierName} ${quote.serviceName}`,
    quote.etd ? `ETD ${quote.etd}` : '',
    selection.destinationLabel ? `Destination ${selection.destinationLabel}` : '',
    `Weight ${weightGrams}g`
  ].filter(Boolean).join(' | ');

  return { cost, note };
}

export type CheckoutResult = {
  order: Order;
  items: OrderItem[];
  receiptToken: string;
  paymentUrl?: string;
};

export async function processCheckout(payload: CheckoutPayload, storeSettings?: StoreSettings): Promise<CheckoutResult> {
  const db = getDb();
  const checkoutItems = normalizeCheckoutItems(payload.items);

  if (!checkoutItems) {
    throw new Error('Invalid checkout items');
  }

  const result = await db.transaction(async (tx) => {
    const now = nowIso();
    const existingCustomers = await tx
      .select({ id: customersTable.id })
      .from(customersTable)
      .where(eq(customersTable.email, payload.customer.email))
      .limit(1);
    let customerId = existingCustomers[0]?.id;

    if (!customerId) {
      customerId = randomUUID();
      await tx
        .insert(customersTable)
        .values({
          id: customerId,
          ...payload.customer,
          totalOrders: 0,
          totalSpent: '0',
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoNothing({ target: customersTable.email });

      const rows = await tx
        .select({ id: customersTable.id })
        .from(customersTable)
        .where(eq(customersTable.email, payload.customer.email))
        .limit(1);
      customerId = rows[0]?.id;
      if (!customerId) throw new Error('Unable to resolve customer');
    }

    const variantIds = checkoutItems.map((item) => item.variantId);
    const variants = await tx
      .select()
      .from(productVariantsTable)
      .where(sql`${productVariantsTable.id} = ANY(${variantIds})`);
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

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

    for (const item of checkoutItems) {
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

    let discount = 0;
    let couponId: string | null = null;

    if (payload.couponCode) {
      const couponCode = payload.couponCode.toUpperCase();
      const couponRows = await tx.select().from(couponsTable).where(eq(couponsTable.code, couponCode)).limit(1);
      const coupon = couponRows[0];
      if (coupon) {
        const value = Number(coupon.value);
        const candidateDiscount =
          coupon.type === 'percentage' ? Math.round((subtotal * value) / 100) : Math.min(value, subtotal);

        if (
          candidateDiscount > 0 &&
          (coupon.minOrderAmount === null || subtotal >= Number(coupon.minOrderAmount))
        ) {
          const updatedCoupons = await tx
            .update(couponsTable)
            .set({
              usedCount: sql`${couponsTable.usedCount} + 1`,
              updatedAt: now
            })
            .where(
              and(
                eq(couponsTable.id, coupon.id),
                eq(couponsTable.active, true),
                sql`(${couponsTable.startsAt} is null or ${couponsTable.startsAt} <= ${now})`,
                sql`(${couponsTable.expiresAt} is null or ${couponsTable.expiresAt} >= ${now})`,
                sql`(${couponsTable.maxUses} is null or ${couponsTable.usedCount} < ${couponsTable.maxUses})`
              )
            )
            .returning({ id: couponsTable.id });

          if (updatedCoupons.length > 0) {
            couponId = coupon.id;
            discount = candidateDiscount;
          }
        }
      }
    }

    if (storeSettings?.minOrderAmount && storeSettings.minOrderAmount > 0 && subtotal < storeSettings.minOrderAmount) {
      throw new Error(`Minimum order amount is Rp ${storeSettings.minOrderAmount.toLocaleString('id-ID')}`);
    }

    const shipping = await resolveSelectedShipping({
      payload,
      items: checkoutItems,
      variantMap: variantMap as Map<string, { weight: unknown }>,
      subtotal,
      freeShippingThreshold: storeSettings?.freeShippingThreshold
    });
    const shippingCost = shipping.cost;
    const notes = [payload.notes || '', shipping.note].filter(Boolean).join('\n\n');

    const total = subtotal - discount + shippingCost;
    const orderId = randomUUID();
    const orderNumber = generateOrderNumber();
    const orderRow = {
      id: orderId,
      orderNumber,
      customerId,
      status: 'pending_payment' as const,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'pending' as const,
      paymentReference: null,
      subtotal: String(subtotal),
      discount: String(discount),
      shippingCost: String(shippingCost),
      total: String(total),
      couponId,
      shippingName: payload.customer.name,
      shippingPhone: payload.customer.phone,
      shippingAddress: payload.customer.address,
      shippingCity: payload.customer.city,
      shippingProvince: payload.customer.province,
      shippingPostalCode: payload.customer.postalCode,
      notes,
      createdAt: now,
      updatedAt: now
    };

    await tx.insert(ordersTable).values(orderRow);

    await tx.insert(orderItemsTable).values(
      orderItems.map((item) => ({
        ...item,
        orderId,
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice)
      }))
    );

    for (const item of checkoutItems) {
      const variant = variantMap.get(item.variantId)!;
      const stockUpdates = await tx
        .update(productVariantsTable)
        .set({
          stock: sql`${productVariantsTable.stock} - ${item.quantity}`,
          updatedAt: now
        })
        .where(
          and(
            eq(productVariantsTable.id, item.variantId),
            sql`${productVariantsTable.stock} >= ${item.quantity}`
          )
        )
        .returning({ newStock: productVariantsTable.stock });

      const newStock = stockUpdates[0]?.newStock;
      if (newStock === undefined) {
        throw new Error(`Insufficient stock for ${variant.name} (SKU: ${variant.sku})`);
      }

      await tx.insert(inventoryLogsTable).values({
        id: randomUUID(),
        variantId: item.variantId,
        previousStock: Number(newStock) + item.quantity,
        newStock: Number(newStock),
        reason: 'order_placed',
        orderId,
        createdAt: now
      });
    }

    await tx
      .update(customersTable)
      .set({
        totalOrders: sql`${customersTable.totalOrders} + 1`,
        totalSpent: sql`${customersTable.totalSpent} + ${total}`,
        updatedAt: now
      })
      .where(eq(customersTable.id, customerId));

    const order: Order = {
      id: orderId,
      orderNumber,
      customerId,
      status: 'pending_payment',
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'pending',
      paymentReference: null,
      subtotal,
      discount,
      shippingCost,
      total,
      couponId,
      shippingName: payload.customer.name,
      shippingPhone: payload.customer.phone,
      shippingAddress: payload.customer.address,
      shippingCity: payload.customer.city,
      shippingProvince: payload.customer.province,
      shippingPostalCode: payload.customer.postalCode,
      notes,
      createdAt: now,
      updatedAt: now,
      items: orderItems.map((item) => ({ ...item, orderId }))
    };

    return {
      order,
      items: order.items!,
      receiptToken: createOrderReceiptToken(order)
    };
  });

  // 8. Payment processing
  let paymentUrl: string | undefined;
  if (payload.paymentMethod === 'midtrans') {
    paymentUrl = await createMidtransTransaction(
      result.order.id,
      result.order.orderNumber,
      result.order.total,
      result.receiptToken,
      payload.customer
    );
  }

  return { ...result, paymentUrl };
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
