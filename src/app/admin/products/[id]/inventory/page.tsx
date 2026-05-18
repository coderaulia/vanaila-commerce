'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { InventoryLog, Product } from '@/features/commerce/types';

type ProductInventoryLog = InventoryLog & {
  productTitle: string;
  variantName: string;
  sku: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatChange(log: InventoryLog): string {
  const diff = log.newStock - log.previousStock;
  return diff > 0 ? `+${diff}` : String(diff);
}

function InventoryLogViewer() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<ProductInventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');

    const res = await fetch(`/api/admin/products/${id}/inventory`);
    if (res.ok) {
      const data = await res.json();
      setProduct(data.product);
      setLogs(data.logs ?? []);
    } else {
      setError('Unable to load inventory history.');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div className="admin-form-grid">
      <div className="admin-form-section">
        <div className="admin-form-section-header">
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>{product?.title ?? 'Product'} Inventory</h3>
            <p className="muted" style={{ margin: 0 }}>Stock changes from orders and manual adjustments.</p>
          </div>
          <Link href={`/admin/products/${id}`} className="admin-btn-sm">
            Back to Product
          </Link>
        </div>

        {!logs.length ? (
          <p className="muted">No inventory changes have been recorded for this product.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Variant</th>
                <th>Change</th>
                <th>Stock</th>
                <th>Reason</th>
                <th>Order</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>
                    <strong>{log.variantName}</strong>
                    <br />
                    <code>{log.sku}</code>
                  </td>
                  <td>{formatChange(log)}</td>
                  <td>
                    {log.previousStock} -&gt; {log.newStock}
                  </td>
                  <td>{log.reason}</td>
                  <td>
                    {log.orderId ? (
                      <Link href={`/admin/orders/${log.orderId}`}>View order</Link>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminProductInventoryPage() {
  return (
    <AdminShell title="Inventory Log">
      {() => <InventoryLogViewer />}
    </AdminShell>
  );
}
