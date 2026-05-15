import { NextResponse } from 'next/server';

import { getAdminSession } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { queryOrders } from '@/features/commerce/store';
import type { OrderStatus } from '@/features/commerce/types';

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const session = await getAdminSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') ?? 'all') as 'all' | OrderStatus;
  const customerId = searchParams.get('customerId') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '20');

  const payload = await queryOrders({ status, customerId, q, page, pageSize });
  return NextResponse.json(payload);
}
