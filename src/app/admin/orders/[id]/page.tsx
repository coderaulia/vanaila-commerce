'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { Order, OrderStatus, PaymentStatus } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusUpdate = async (status: OrderStatus) => {
    setSaving(true);
    const res = await csrfFetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setSaving(false);
  };

  const handlePaymentConfirm = async () => {
    setSaving(true);
    const res = await csrfFetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid' as PaymentStatus })
    });
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
    }
    setSaving(false);
  };

  if (loading) return <p className="muted">Loading...</p>;
  if (!order) return <p className="admin-error">Order not found</p>;

  return (
    <div className="admin-form-grid">
      <div className="admin-detail-header">
        <h2>{order.orderNumber}</h2>
        <div className="admin-chip-group">
          <span className={`admin-chip admin-chip-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
          <span className={`admin-chip admin-chip-${order.paymentStatus}`}>{order.paymentStatus}</span>
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Customer & Shipping</h3>
        <p><strong>{order.shippingName}</strong></p>
        <p>{order.shippingPhone}</p>
        <p>{order.shippingAddress}</p>
        <p>{order.shippingCity}, {order.shippingProvince} {order.shippingPostalCode}</p>
      </div>

      {order.items?.length ? (
        <div className="admin-form-section">
          <h3>Items</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productTitle}</td>
                  <td><code>{item.sku}</code></td>
                  <td>{item.quantity}</td>
                  <td>Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                  <td>Rp {item.totalPrice.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="admin-form-section">
        <h3>Totals</h3>
        <p>Subtotal: Rp {order.subtotal.toLocaleString('id-ID')}</p>
        {order.discount > 0 && <p>Discount: -Rp {order.discount.toLocaleString('id-ID')}</p>}
        {order.shippingCost > 0 && <p>Shipping: Rp {order.shippingCost.toLocaleString('id-ID')}</p>}
        <p><strong>Total: Rp {order.total.toLocaleString('id-ID')}</strong></p>
        <p>Payment: {order.paymentMethod === 'midtrans' ? 'Midtrans' : 'Manual Transfer'}</p>
      </div>

      <div className="admin-form-section">
        <h3>Actions</h3>
        <div className="admin-btn-group">
          {order.paymentStatus === 'pending' && order.paymentMethod === 'manual_transfer' && (
            <button type="button" className="admin-btn admin-btn-primary" onClick={handlePaymentConfirm} disabled={saving}>
              Confirm Payment
            </button>
          )}
          {order.status === 'paid' && (
            <button type="button" className="admin-btn" onClick={() => handleStatusUpdate('processing')} disabled={saving}>
              Mark Processing
            </button>
          )}
          {order.status === 'processing' && (
            <button type="button" className="admin-btn" onClick={() => handleStatusUpdate('shipped')} disabled={saving}>
              Mark Shipped
            </button>
          )}
          {order.status === 'shipped' && (
            <button type="button" className="admin-btn" onClick={() => handleStatusUpdate('delivered')} disabled={saving}>
              Mark Delivered
            </button>
          )}
          {!['cancelled', 'refunded', 'delivered'].includes(order.status) && (
            <button type="button" className="admin-btn admin-btn-danger" onClick={() => handleStatusUpdate('cancelled')} disabled={saving}>
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn" onClick={() => router.push('/admin/orders')}>
          Back to Orders
        </button>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <AdminShell title="Order Detail">
      {() => <OrderDetail />}
    </AdminShell>
  );
}
