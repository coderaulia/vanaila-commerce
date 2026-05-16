import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db/client';
import { customersTable } from '@/db/schema';
import { getCustomerSession } from '@/features/commerce/customerAuth';

export async function PUT(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, phone, address, city, province, postalCode } = body as Record<string, string>;

  const updates: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };
  if (name?.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (address !== undefined) updates.address = address.trim();
  if (city !== undefined) updates.city = city.trim();
  if (province !== undefined) updates.province = province.trim();
  if (postalCode !== undefined) updates.postalCode = postalCode.trim();

  const db = getDb();
  const rows = await db
    .update(customersTable)
    .set(updates)
    .where(eq(customersTable.id, session.id))
    .returning();

  const c = rows[0];
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    customer: {
      id: c.id,
      email: c.email,
      name: c.name,
      phone: c.phone,
      address: c.address,
      city: c.city,
      province: c.province,
      postalCode: c.postalCode,
    },
  });
}
