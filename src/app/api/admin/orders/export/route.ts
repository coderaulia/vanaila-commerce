import { NextResponse } from 'next/server';

import { assertAdminPermission } from '@/features/cms/adminAuth';
import { modules } from '@/config/modules';
import { queryAllOrdersForExport } from '@/features/commerce/store';
import type { OrderStatus } from '@/features/commerce/types';
import { assertRateLimit } from '@/services/requestSecurity';

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const CSV_HEADERS = [
  'Order #',
  'Date',
  'Status',
  'Payment Method',
  'Payment Status',
  'Customer Name',
  'Customer Phone',
  'Shipping Address',
  'City',
  'Province',
  'Postal Code',
  'Subtotal',
  'Discount',
  'Shipping Cost',
  'Total',
  'Notes',
];

export async function GET(request: Request) {
  if (!modules.ENABLE_STORE_MODULE) {
    return NextResponse.json({ error: 'Store module disabled' }, { status: 404 });
  }

  const auth = await assertAdminPermission(request, 'store:manage_orders');
  if ('error' in auth) return auth.error;

  const rl = await assertRateLimit(request, 'admin-orders-export', 10, 60_000);
  if (rl) return rl;

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') ?? 'all') as 'all' | OrderStatus;
  const q = searchParams.get('q') ?? undefined;

  const orders = await queryAllOrdersForExport({ status, q });

  const rows = [
    CSV_HEADERS.join(','),
    ...orders.map((o) =>
      [
        escapeCsv(o.orderNumber),
        escapeCsv(new Date(o.createdAt).toISOString().slice(0, 10)),
        escapeCsv(o.status),
        escapeCsv(o.paymentMethod),
        escapeCsv(o.paymentStatus),
        escapeCsv(o.shippingName),
        escapeCsv(o.shippingPhone),
        escapeCsv(o.shippingAddress),
        escapeCsv(o.shippingCity),
        escapeCsv(o.shippingProvince),
        escapeCsv(o.shippingPostalCode),
        escapeCsv(o.subtotal),
        escapeCsv(o.discount),
        escapeCsv(o.shippingCost),
        escapeCsv(o.total),
        escapeCsv(o.notes),
      ].join(',')
    ),
  ].join('\r\n');

  const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
