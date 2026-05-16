import { NextResponse } from 'next/server';

import { getCustomerSession } from '@/features/commerce/customerAuth';

export async function GET() {
  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ customer });
}
