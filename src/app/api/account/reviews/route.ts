import { NextResponse } from 'next/server';

import { getCustomerSession } from '@/features/commerce/customerAuth';
import { queryCustomerProductReviews } from '@/features/commerce/store';

export async function GET() {
  const customer = await getCustomerSession();
  if (!customer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviews = await queryCustomerProductReviews(customer.id);
  return NextResponse.json({ reviews });
}
