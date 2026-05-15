'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { AdminSessionUser } from '@/features/cms/adminTypes';
import type { Product } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

type ProductListPayload = {
  products: Product[];
  meta: { total: number; page: number; pageSize: number };
};

function ProductsList({ user }: { user: AdminSessionUser }) {
  const [data, setData] = useState<ProductListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const canEdit = user.permissions.includes('store:edit');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), pageSize: '20' });
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [q, status, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await csrfFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  return (
    <div>
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search products..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="admin-input"
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-select">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : !data?.products.length ? (
        <p className="muted">No products found.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Updated</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/admin/products/${product.id}`}>{product.title}</Link>
                  </td>
                  <td><span className={`admin-chip admin-chip-${product.status}`}>{product.status}</span></td>
                  <td>{product.featured ? '⭐' : '—'}</td>
                  <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                  {canEdit && (
                    <td>
                      <button type="button" className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(product.id)}>
                        Delete
                      </button>
                    </td>
                  )}
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

export default function AdminProductsPage() {
  return (
    <AdminShell
      title="Products"
      description="Manage your store products"
      actions={
        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
          New Product
        </Link>
      }
    >
      {(user) => <ProductsList user={user} />}
    </AdminShell>
  );
}
