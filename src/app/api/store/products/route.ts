import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { queryProducts } from '@/features/commerce/store';

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '12');

  const payload = await queryProducts({ status: 'active', categoryId, q, page, pageSize });
  return NextResponse.json(payload);
}
