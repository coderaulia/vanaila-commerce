import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db/client';
import { customersTable } from '@/db/schema';
import { getCustomerSession } from '@/features/commerce/customerAuth';
import { assertTrustedMutationRequest } from '@/services/requestSecurity';

export async function PUT(request: Request) {
  const csrf = assertTrustedMutationRequest(request);
  if (csrf) return csrf;

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

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const str = (v: unknown, max: number) =>
    typeof v === 'string' ? v.trim().slice(0, max) : undefined;

  const updates: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };

  const name = str(raw.name, 100);
  const phone = str(raw.phone, 30);
  const address = str(raw.address, 300);
  const city = str(raw.city, 100);
  const province = str(raw.province, 100);
  const postalCode = str(raw.postalCode, 20);

  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone ?? '';
  if (address !== undefined) updates.address = address ?? '';
  if (city !== undefined) updates.city = city ?? '';
  if (province !== undefined) updates.province = province ?? '';
  if (postalCode !== undefined) updates.postalCode = postalCode ?? '';

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
