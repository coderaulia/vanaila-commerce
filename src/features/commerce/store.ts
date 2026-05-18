import { randomUUID } from 'node:crypto';

import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { getDb } from '@/db/client';
import {
  couponsTable,
  customersTable,
  inventoryLogsTable,
  orderItemsTable,
  ordersTable,
  productCategoriesTable,
  productReviewsTable,
  productVariantsTable,
  productsTable
} from '@/db/schema';

import type {
  Coupon,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductCategory,
  InventoryLog,
  ProductReview,
  ProductReviewStatus,
  ProductVariant
} from './types';

const nowIso = () => new Date().toISOString();

// ─── Products ───────────────────────────────────────────────────────────────

export type ProductQueryInput = {
  status?: 'all' | 'draft' | 'active' | 'archived';
  categoryId?: string;
  featured?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type StoreDashboardMetrics = {
  revenue: number;
  totalOrders: number;
  openOrders: number;
  paidOrders: number;
  activeProducts: number;
  draftProducts: number;
  customers: number;
  lowStockVariants: number;
  lowStockThreshold: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
    createdAt: string;
  }>;
};

export async function queryProducts(input: ProductQueryInput = {}) {
  const db = getDb();
  const { status = 'all', categoryId, featured, q, page = 1, pageSize = 20 } = input;

  const conditions = [];
  if (status !== 'all') conditions.push(eq(productsTable.status, status));
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (featured !== undefined) conditions.push(eq(productsTable.featured, featured));
  if (q) conditions.push(or(ilike(productsTable.title, `%${q}%`), ilike(productsTable.slug, `%${q}%`)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(productsTable)
      .where(where)
      .orderBy(asc(productsTable.sortOrder), desc(productsTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(where)
  ]);

  const products: Product[] = items.map(mapProductRow);
  if (products.length > 0) {
    const variants = await db
      .select()
      .from(productVariantsTable)
      .where(inArray(productVariantsTable.productId, products.map((product) => product.id)))
      .orderBy(asc(productVariantsTable.sortOrder));
    const variantsByProduct = new Map<string, ProductVariant[]>();

    for (const variant of variants.map(mapVariantRow)) {
      const current = variantsByProduct.get(variant.productId) ?? [];
      current.push(variant);
      variantsByProduct.set(variant.productId, current);
    }

    for (const product of products) {
      product.variants = variantsByProduct.get(product.id) ?? [];
    }
  }

  return { products, meta: { total: countResult[0]?.count ?? 0, page, pageSize } };
}

export async function getStoreDashboardMetrics(threshold = 5): Promise<StoreDashboardMetrics> {
  const db = getDb();
  const lowStockThreshold = Math.max(0, threshold);

  const [
    revenueResult,
    orderResult,
    openOrderResult,
    paidOrderResult,
    activeProductResult,
    draftProductResult,
    customerResult,
    lowStockResult,
    recentOrderRows
  ] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${ordersTable.total}), 0)` })
      .from(ordersTable)
      .where(eq(ordersTable.paymentStatus, 'paid')),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ordersTable)
      .where(inArray(ordersTable.status, ['pending_payment', 'paid', 'processing', 'shipped'])),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ordersTable)
      .where(eq(ordersTable.paymentStatus, 'paid')),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.status, 'active')),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.status, 'draft')),
    db.select({ count: sql<number>`count(*)::int` }).from(customersTable),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productVariantsTable)
      .where(sql`${productVariantsTable.stock} <= ${lowStockThreshold}`),
    db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        customerName: ordersTable.shippingName,
        status: ordersTable.status,
        paymentStatus: ordersTable.paymentStatus,
        total: ordersTable.total,
        createdAt: ordersTable.createdAt
      })
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(6)
  ]);

  return {
    revenue: Number(revenueResult[0]?.total ?? 0),
    totalOrders: orderResult[0]?.count ?? 0,
    openOrders: openOrderResult[0]?.count ?? 0,
    paidOrders: paidOrderResult[0]?.count ?? 0,
    activeProducts: activeProductResult[0]?.count ?? 0,
    draftProducts: draftProductResult[0]?.count ?? 0,
    customers: customerResult[0]?.count ?? 0,
    lowStockVariants: lowStockResult[0]?.count ?? 0,
    lowStockThreshold,
    recentOrders: recentOrderRows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      customerName: row.customerName,
      status: row.status,
      paymentStatus: row.paymentStatus,
      total: Number(row.total),
      createdAt: row.createdAt
    }))
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = getDb();
  const rows = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!rows[0]) return null;
  const product = mapProductRow(rows[0]);
  const variants = await db
    .select()
    .from(productVariantsTable)
    .where(eq(productVariantsTable.productId, id))
    .orderBy(asc(productVariantsTable.sortOrder));
  product.variants = variants.map(mapVariantRow);
  return product;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getDb();
  const rows = await db.select().from(productsTable).where(eq(productsTable.slug, slug)).limit(1);
  if (!rows[0]) return null;
  const product = mapProductRow(rows[0]);
  const variants = await db
    .select()
    .from(productVariantsTable)
    .where(eq(productVariantsTable.productId, product.id))
    .orderBy(asc(productVariantsTable.sortOrder));
  product.variants = variants.map(mapVariantRow);
  return product;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const db = getDb();
  const now = nowIso();
  const id = data.id || randomUUID();
  const slug = data.slug || id;

  const row = {
    id,
    title: data.title || 'Untitled Product',
    slug,
    description: data.description || '',
    shortDescription: data.shortDescription || '',
    status: data.status || 'draft',
    categoryId: data.categoryId || null,
    images: data.images || [],
    featured: data.featured || false,
    sortOrder: data.sortOrder ?? 0,
    seoTitle: data.seoTitle || '',
    seoDescription: data.seoDescription || '',
    createdAt: now,
    updatedAt: now
  } as const;

  await db.insert(productsTable).values(row);
  return mapProductRow(row);
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
  const db = getDb();
  const now = nowIso();

  const result = await db
    .update(productsTable)
    .set({ ...data, updatedAt: now })
    .where(eq(productsTable.id, id))
    .returning();

  return result[0] ? mapProductRow(result[0]) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDb();
  await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, id));
  const result = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
  return result.length > 0;
}

// ─── Product Variants ───────────────────────────────────────────────────────

export async function createVariant(data: Partial<ProductVariant> & { productId: string }): Promise<ProductVariant> {
  const db = getDb();
  const now = nowIso();
  const id = data.id || randomUUID();

  const row = {
    id,
    productId: data.productId,
    sku: data.sku || id.slice(0, 8).toUpperCase(),
    name: data.name || 'Default',
    price: String(data.price ?? 0),
    compareAtPrice: data.compareAtPrice != null ? String(data.compareAtPrice) : null,
    stock: data.stock ?? 0,
    weight: data.weight != null ? String(data.weight) : null,
    options: data.options || {},
    sortOrder: data.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now
  };

  await db.insert(productVariantsTable).values(row);
  return mapVariantRow(row);
}

export async function updateVariant(id: string, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
  const db = getDb();
  const now = nowIso();

  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.name !== undefined) updates.name = data.name;
  if (data.sku !== undefined) updates.sku = data.sku;
  if (data.price !== undefined) updates.price = String(data.price);
  if (data.compareAtPrice !== undefined) updates.compareAtPrice = data.compareAtPrice != null ? String(data.compareAtPrice) : null;
  if (data.stock !== undefined) updates.stock = data.stock;
  if (data.weight !== undefined) updates.weight = data.weight != null ? String(data.weight) : null;
  if (data.options !== undefined) updates.options = data.options;
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

  const result = await db
    .update(productVariantsTable)
    .set(updates)
    .where(eq(productVariantsTable.id, id))
    .returning();

  return result[0] ? mapVariantRow(result[0]) : null;
}

export async function deleteVariant(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(productVariantsTable).where(eq(productVariantsTable.id, id)).returning();
  return result.length > 0;
}

// ─── Product Categories ─────────────────────────────────────────────────────

export async function getProductCategories(): Promise<ProductCategory[]> {
  const db = getDb();
  const rows = await db.select().from(productCategoriesTable).orderBy(asc(productCategoriesTable.sortOrder));
  return rows.map(mapProductCategoryRow);
}

export async function createProductCategory(data: Partial<ProductCategory>): Promise<ProductCategory> {
  const db = getDb();
  const now = nowIso();
  const id = data.id || randomUUID();

  const row = {
    id,
    name: data.name || 'Untitled',
    slug: data.slug || id,
    description: data.description || '',
    parentId: data.parentId || null,
    image: data.image || '',
    sortOrder: data.sortOrder ?? 0,
    createdAt: now,
    updatedAt: now
  };

  await db.insert(productCategoriesTable).values(row);
  return mapProductCategoryRow(row);
}

export async function updateProductCategory(id: string, data: Partial<ProductCategory>): Promise<ProductCategory | null> {
  const db = getDb();
  const now = nowIso();
  const result = await db
    .update(productCategoriesTable)
    .set({ ...data, updatedAt: now })
    .where(eq(productCategoriesTable.id, id))
    .returning();
  return result[0] ? mapProductCategoryRow(result[0]) : null;
}

export async function deleteProductCategory(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(productCategoriesTable).where(eq(productCategoriesTable.id, id)).returning();
  return result.length > 0;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export type OrderQueryInput = {
  status?: 'all' | OrderStatus;
  customerId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

function orderSearchCondition(q?: string): SQL | undefined {
  const term = q?.trim();
  if (!term) return undefined;

  const likeTerm = `%${term}%`;

  return or(
    ilike(ordersTable.orderNumber, likeTerm),
    ilike(ordersTable.shippingName, likeTerm),
    sql`exists (
      select 1
      from ${orderItemsTable}
      left join ${productVariantsTable}
        on ${productVariantsTable.id} = ${orderItemsTable.variantId}
      left join ${productsTable}
        on ${productsTable.id} = ${orderItemsTable.productId}
      where ${orderItemsTable.orderId} = ${ordersTable.id}
        and (
          ${orderItemsTable.productTitle} ilike ${likeTerm}
          or ${orderItemsTable.variantName} ilike ${likeTerm}
          or ${orderItemsTable.sku} ilike ${likeTerm}
          or ${productVariantsTable.name} ilike ${likeTerm}
          or ${productsTable.title} ilike ${likeTerm}
        )
    )`
  );
}

export async function queryAllOrdersForExport(input: Pick<OrderQueryInput, 'status' | 'q'> = {}): Promise<Order[]> {
  const db = getDb();
  const { status = 'all', q } = input;

  const conditions = [];
  if (status !== 'all') conditions.push(eq(ordersTable.status, status));
  const search = orderSearchCondition(q);
  if (search) conditions.push(search);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt));
  return items.map(mapOrderRow);
}

export async function queryOrders(input: OrderQueryInput = {}) {
  const db = getDb();
  const { status = 'all', customerId, q, page = 1, pageSize = 20 } = input;

  const conditions = [];
  if (status !== 'all') conditions.push(eq(ordersTable.status, status));
  if (customerId) conditions.push(eq(ordersTable.customerId, customerId));
  const search = orderSearchCondition(q);
  if (search) conditions.push(search);

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(ordersTable)
      .where(where)
      .orderBy(desc(ordersTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ordersTable)
      .where(where)
  ]);

  const orders: Order[] = items.map(mapOrderRow);
  return { orders, meta: { total: countResult[0]?.count ?? 0, page, pageSize } };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getDb();
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!rows[0]) return null;
  const order = mapOrderRow(rows[0]);
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  order.items = items.map(mapOrderItemRow);
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const db = getDb();
  const now = nowIso();
  const result = await db
    .update(ordersTable)
    .set({ status, updatedAt: now })
    .where(eq(ordersTable.id, id))
    .returning();
  return result[0] ? mapOrderRow(result[0]) : null;
}

export async function updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentReference?: string): Promise<Order | null> {
  const db = getDb();
  const now = nowIso();
  const updates: Record<string, unknown> = { paymentStatus, updatedAt: now };
  if (paymentReference !== undefined) updates.paymentReference = paymentReference;
  if (paymentStatus === 'paid') updates.status = 'paid';

  const result = await db
    .update(ordersTable)
    .set(updates)
    .where(eq(ordersTable.id, id))
    .returning();
  return result[0] ? mapOrderRow(result[0]) : null;
}

// ─── Customers ──────────────────────────────────────────────────────────────

export type CustomerQueryInput = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function queryCustomers(input: CustomerQueryInput = {}) {
  const db = getDb();
  const { q, page = 1, pageSize = 20 } = input;

  const conditions = [];
  if (q) conditions.push(or(ilike(customersTable.name, `%${q}%`), ilike(customersTable.email, `%${q}%`)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(customersTable)
      .where(where)
      .orderBy(desc(customersTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customersTable)
      .where(where)
  ]);

  const customers: Customer[] = items.map(mapCustomerRow);
  return { customers, meta: { total: countResult[0]?.count ?? 0, page, pageSize } };
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = getDb();
  const rows = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
  return rows[0] ? mapCustomerRow(rows[0]) : null;
}

export async function getOrCreateCustomer(data: { email: string; name: string; phone: string; address: string; city: string; province: string; postalCode: string }): Promise<Customer> {
  const db = getDb();
  const existing = await db.select().from(customersTable).where(eq(customersTable.email, data.email)).limit(1);
  if (existing[0]) {
    return mapCustomerRow(existing[0]);
  }

  const now = nowIso();
  const id = randomUUID();
  const row = { id, ...data, totalOrders: 0, totalSpent: '0', createdAt: now, updatedAt: now };
  await db.insert(customersTable).values(row).onConflictDoNothing({ target: customersTable.email });
  const rows = await db.select().from(customersTable).where(eq(customersTable.email, data.email)).limit(1);
  return mapCustomerRow(rows[0] || row);
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export async function getCoupons(): Promise<Coupon[]> {
  const db = getDb();
  const rows = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  return rows.map(mapCouponRow);
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const db = getDb();
  const rows = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase())).limit(1);
  return rows[0] ? mapCouponRow(rows[0]) : null;
}

export async function createCoupon(data: Partial<Coupon>): Promise<Coupon> {
  const db = getDb();
  const now = nowIso();
  const id = data.id || randomUUID();

  const row = {
    id,
    code: (data.code || randomUUID().slice(0, 8)).toUpperCase(),
    type: data.type || 'percentage',
    value: String(data.value ?? 0),
    minOrderAmount: data.minOrderAmount != null ? String(data.minOrderAmount) : null,
    maxUses: data.maxUses ?? null,
    usedCount: 0,
    active: data.active ?? true,
    startsAt: data.startsAt || null,
    expiresAt: data.expiresAt || null,
    createdAt: now,
    updatedAt: now
  };

  await db.insert(couponsTable).values(row);
  return mapCouponRow(row);
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | null> {
  const db = getDb();
  const now = nowIso();
  const updates: Record<string, unknown> = { updatedAt: now };
  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.type !== undefined) updates.type = data.type;
  if (data.value !== undefined) updates.value = String(data.value);
  if (data.minOrderAmount !== undefined) updates.minOrderAmount = data.minOrderAmount != null ? String(data.minOrderAmount) : null;
  if (data.maxUses !== undefined) updates.maxUses = data.maxUses;
  if (data.active !== undefined) updates.active = data.active;
  if (data.startsAt !== undefined) updates.startsAt = data.startsAt;
  if (data.expiresAt !== undefined) updates.expiresAt = data.expiresAt;

  const result = await db.update(couponsTable).set(updates).where(eq(couponsTable.id, id)).returning();
  return result[0] ? mapCouponRow(result[0]) : null;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(couponsTable).where(eq(couponsTable.id, id)).returning();
  return result.length > 0;
}

// ─── Inventory ──────────────────────────────────────────────────────────────

export type ProductInventoryLog = InventoryLog & {
  variantName: string;
  sku: string;
  productTitle: string;
};

export async function getProductInventoryLogs(productId: string): Promise<ProductInventoryLog[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: inventoryLogsTable.id,
      variantId: inventoryLogsTable.variantId,
      previousStock: inventoryLogsTable.previousStock,
      newStock: inventoryLogsTable.newStock,
      reason: inventoryLogsTable.reason,
      orderId: inventoryLogsTable.orderId,
      createdAt: inventoryLogsTable.createdAt,
      variantName: productVariantsTable.name,
      sku: productVariantsTable.sku,
      productTitle: productsTable.title
    })
    .from(inventoryLogsTable)
    .innerJoin(productVariantsTable, eq(productVariantsTable.id, inventoryLogsTable.variantId))
    .innerJoin(productsTable, eq(productsTable.id, productVariantsTable.productId))
    .where(eq(productVariantsTable.productId, productId))
    .orderBy(desc(inventoryLogsTable.createdAt));

  return rows.map((row) => ({
    id: row.id,
    variantId: row.variantId,
    previousStock: Number(row.previousStock),
    newStock: Number(row.newStock),
    reason: row.reason,
    orderId: row.orderId,
    createdAt: row.createdAt,
    variantName: row.variantName,
    sku: row.sku,
    productTitle: row.productTitle
  }));
}

export async function adjustStock(variantId: string, newStock: number, reason: string, orderId?: string): Promise<void> {
  const db = getDb();
  const now = nowIso();

  const variant = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, variantId)).limit(1);
  const previousStock = variant[0] ? Number(variant[0].stock) : 0;

  await db.update(productVariantsTable).set({ stock: newStock, updatedAt: now }).where(eq(productVariantsTable.id, variantId));

  await db.insert(inventoryLogsTable).values({
    id: randomUUID(),
    variantId,
    previousStock,
    newStock,
    reason,
    orderId: orderId || null,
    createdAt: now
  });
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export type ProductReviewInput = {
  productId: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  body: string;
  customerId?: string | null;
};

export type ReviewQueryInput = {
  status?: 'all' | ProductReviewStatus;
  page?: number;
  pageSize?: number;
};

export type AdminProductReview = ProductReview & {
  productTitle: string;
  productSlug: string;
};

export async function getApprovedProductReviews(productId: string): Promise<ProductReview[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(productReviewsTable)
    .where(and(eq(productReviewsTable.productId, productId), eq(productReviewsTable.status, 'approved')))
    .orderBy(desc(productReviewsTable.createdAt));

  return rows.map(mapProductReviewRow);
}

export async function hasCustomerPurchasedProduct(customerId: string, productId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.customerId, customerId),
        eq(orderItemsTable.productId, productId),
        or(
          eq(ordersTable.paymentStatus, 'paid'),
          inArray(ordersTable.status, ['paid', 'processing', 'shipped', 'delivered'])
        )
      )
    )
    .limit(1);

  return rows.length > 0;
}

export async function createProductReview(input: ProductReviewInput): Promise<ProductReview> {
  const db = getDb();
  const now = nowIso();
  const id = randomUUID();
  const row = {
    id,
    productId: input.productId,
    customerId: input.customerId ?? null,
    authorName: input.authorName,
    authorEmail: input.authorEmail,
    rating: input.rating,
    body: input.body,
    status: 'pending' as const,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now
  };

  await db.insert(productReviewsTable).values(row);
  return mapProductReviewRow(row);
}

export async function queryProductReviews(input: ReviewQueryInput = {}) {
  const db = getDb();
  const { status = 'pending', page = 1, pageSize = 20 } = input;
  const where = status === 'all' ? undefined : eq(productReviewsTable.status, status);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: productReviewsTable.id,
        productId: productReviewsTable.productId,
        customerId: productReviewsTable.customerId,
        authorName: productReviewsTable.authorName,
        authorEmail: productReviewsTable.authorEmail,
        rating: productReviewsTable.rating,
        body: productReviewsTable.body,
        status: productReviewsTable.status,
        reviewedAt: productReviewsTable.reviewedAt,
        createdAt: productReviewsTable.createdAt,
        updatedAt: productReviewsTable.updatedAt,
        productTitle: productsTable.title,
        productSlug: productsTable.slug
      })
      .from(productReviewsTable)
      .innerJoin(productsTable, eq(productsTable.id, productReviewsTable.productId))
      .where(where)
      .orderBy(desc(productReviewsTable.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(productReviewsTable)
      .where(where)
  ]);

  const reviews: AdminProductReview[] = items.map((row) => ({
    ...mapProductReviewRow(row),
    productTitle: row.productTitle,
    productSlug: row.productSlug
  }));

  return { reviews, meta: { total: countResult[0]?.count ?? 0, page, pageSize } };
}

export async function updateProductReviewStatus(id: string, status: ProductReviewStatus): Promise<ProductReview | null> {
  const db = getDb();
  const now = nowIso();
  const result = await db
    .update(productReviewsTable)
    .set({
      status,
      reviewedAt: status === 'pending' ? null : now,
      updatedAt: now
    })
    .where(eq(productReviewsTable.id, id))
    .returning();

  return result[0] ? mapProductReviewRow(result[0]) : null;
}

// ─── Row Mappers ────────────────────────────────────────────────────────────

function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    description: (row.description as string) || '',
    shortDescription: (row.shortDescription ?? row.short_description ?? '') as string,
    status: (row.status as Product['status']) || 'draft',
    categoryId: (row.categoryId ?? row.category_id ?? null) as string | null,
    images: (row.images as string[]) || [],
    featured: Boolean(row.featured),
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    seoTitle: (row.seoTitle ?? row.seo_title ?? '') as string,
    seoDescription: (row.seoDescription ?? row.seo_description ?? '') as string,
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}

function mapVariantRow(row: Record<string, unknown>): ProductVariant {
  return {
    id: row.id as string,
    productId: (row.productId ?? row.product_id) as string,
    sku: row.sku as string,
    name: row.name as string,
    price: Number(row.price),
    compareAtPrice: row.compareAtPrice != null || row.compare_at_price != null ? Number(row.compareAtPrice ?? row.compare_at_price) : null,
    stock: Number(row.stock ?? 0),
    weight: row.weight != null ? Number(row.weight) : null,
    options: (row.options as Record<string, string>) || {},
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}

function mapProductCategoryRow(row: Record<string, unknown>): ProductCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) || '',
    parentId: (row.parentId ?? row.parent_id ?? null) as string | null,
    image: (row.image as string) || '',
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}

function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    orderNumber: (row.orderNumber ?? row.order_number) as string,
    customerId: (row.customerId ?? row.customer_id) as string,
    status: (row.status as Order['status']) || 'pending_payment',
    paymentMethod: (row.paymentMethod ?? row.payment_method) as Order['paymentMethod'],
    paymentStatus: (row.paymentStatus ?? row.payment_status) as Order['paymentStatus'],
    paymentReference: (row.paymentReference ?? row.payment_reference ?? null) as string | null,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount ?? 0),
    shippingCost: Number(row.shippingCost ?? row.shipping_cost ?? 0),
    total: Number(row.total),
    couponId: (row.couponId ?? row.coupon_id ?? null) as string | null,
    shippingName: (row.shippingName ?? row.shipping_name) as string,
    shippingPhone: (row.shippingPhone ?? row.shipping_phone) as string,
    shippingAddress: (row.shippingAddress ?? row.shipping_address) as string,
    shippingCity: (row.shippingCity ?? row.shipping_city) as string,
    shippingProvince: (row.shippingProvince ?? row.shipping_province) as string,
    shippingPostalCode: (row.shippingPostalCode ?? row.shipping_postal_code) as string,
    notes: (row.notes as string) || '',
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}

function mapOrderItemRow(row: Record<string, unknown>): OrderItem {
  return {
    id: row.id as string,
    orderId: (row.orderId ?? row.order_id) as string,
    productId: (row.productId ?? row.product_id) as string,
    variantId: (row.variantId ?? row.variant_id) as string,
    productTitle: (row.productTitle ?? row.product_title) as string,
    variantName: (row.variantName ?? row.variant_name) as string,
    sku: row.sku as string,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unitPrice ?? row.unit_price),
    totalPrice: Number(row.totalPrice ?? row.total_price)
  };
}

function mapCustomerRow(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    phone: (row.phone as string) || '',
    address: (row.address as string) || '',
    city: (row.city as string) || '',
    province: (row.province as string) || '',
    postalCode: (row.postalCode ?? row.postal_code ?? '') as string,
    totalOrders: Number(row.totalOrders ?? row.total_orders ?? 0),
    totalSpent: Number(row.totalSpent ?? row.total_spent ?? 0),
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}

function mapCouponRow(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    code: row.code as string,
    type: (row.type as Coupon['type']) || 'percentage',
    value: Number(row.value),
    minOrderAmount: row.minOrderAmount != null || row.min_order_amount != null ? Number(row.minOrderAmount ?? row.min_order_amount) : null,
    maxUses: row.maxUses != null || row.max_uses != null ? Number(row.maxUses ?? row.max_uses) : null,
    usedCount: Number(row.usedCount ?? row.used_count ?? 0),
    active: Boolean(row.active),
    startsAt: (row.startsAt ?? row.starts_at ?? null) as string | null,
    expiresAt: (row.expiresAt ?? row.expires_at ?? null) as string | null,
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}

function mapProductReviewRow(row: Record<string, unknown>): ProductReview {
  return {
    id: row.id as string,
    productId: (row.productId ?? row.product_id) as string,
    customerId: (row.customerId ?? row.customer_id ?? null) as string | null,
    authorName: (row.authorName ?? row.author_name) as string,
    authorEmail: (row.authorEmail ?? row.author_email) as string,
    rating: Number(row.rating),
    body: row.body as string,
    status: (row.status as ProductReview['status']) || 'pending',
    reviewedAt: (row.reviewedAt ?? row.reviewed_at ?? null) as string | null,
    createdAt: (row.createdAt ?? row.created_at) as string,
    updatedAt: (row.updatedAt ?? row.updated_at) as string
  };
}
