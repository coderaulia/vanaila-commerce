'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { Order } from '@/features/commerce/types';

type OrderListPayload = {
  orders: Order[];
  meta: { total: number; page: number; pageSize: number };
};

function OrdersList() {
  const [data, setData] = useState<OrderListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), pageSize: '20' });
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [status, q, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams({ status });
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/orders/export?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  return (
    <div>
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by order # or name..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="admin-input"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-select">
          <option value="all">All Status</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="paid">Paid</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <button type="button" className="admin-btn admin-btn-secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : !data?.orders.length ? (
        <p className="muted">No orders found.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
                  <td>{order.shippingName}</td>
                  <td><span className={`admin-chip admin-chip-${order.status}`}>{order.status.replace(/_/g, ' ')}</span></td>
                  <td><span className={`admin-chip admin-chip-${order.paymentStatus}`}>{order.paymentStatus}</span></td>
                  <td>Rp {order.total.toLocaleString('id-ID')}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminShell title="Orders" description="Manage customer orders">
      {() => <OrdersList />}
    </AdminShell>
  );
}
