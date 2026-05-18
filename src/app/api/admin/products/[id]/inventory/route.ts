import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { getProductById, getProductInventoryLogs } from '@/features/commerce/store';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:edit');
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const logs = await getProductInventoryLogs(id);
  return NextResponse.json({ product, logs });
}
