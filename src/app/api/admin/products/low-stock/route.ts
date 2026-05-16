import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { assertAdminPermission } from '@/features/cms/adminAuth';
import { getDb } from '@/db/client';
import { productVariantsTable, productsTable } from '@/db/schema';
import { lte, eq } from 'drizzle-orm';

const DEFAULT_THRESHOLD = 5;

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const threshold = Math.max(
    0,
    Number(searchParams.get('threshold') ?? process.env.LOW_STOCK_THRESHOLD ?? DEFAULT_THRESHOLD)
  ) || DEFAULT_THRESHOLD;

  const db = getDb();
  const rows = await db
    .select({
      variantId: productVariantsTable.id,
      sku: productVariantsTable.sku,
      variantName: productVariantsTable.name,
      stock: productVariantsTable.stock,
      productId: productsTable.id,
      productTitle: productsTable.title,
      productSlug: productsTable.slug
    })
    .from(productVariantsTable)
    .innerJoin(productsTable, eq(productVariantsTable.productId, productsTable.id))
    .where(lte(productVariantsTable.stock, threshold))
    .orderBy(productVariantsTable.stock);

  return NextResponse.json({ variants: rows, threshold });
}
