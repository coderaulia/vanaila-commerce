'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { AdminSessionUser } from '@/features/cms/adminTypes';
import type { Product, ProductCategory } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

type ProductListPayload = {
  products: Product[];
  meta: { total: number; page: number; pageSize: number };
};

type LowStockPayload = {
  variants: { variantId: string; sku: string; variantName: string; stock: number; productId: string; productTitle: string; productSlug: string }[];
  threshold: number;
};

function LowStockBanner({ canEdit }: { canEdit: boolean }) {
  const [data, setData] = useState<LowStockPayload | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/products/low-stock')
      .then((res) => res.ok ? res.json() : null)
      .then((json) => { if (json) setData(json as LowStockPayload); })
      .catch(() => {});
  }, []);

  if (!data || data.variants.length === 0) return null;

  return (
    <div className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-amber-800">
          ⚠ {data.variants.length} variant{data.variants.length !== 1 ? 's' : ''} low on stock (≤ {data.threshold} units)
        </span>
        <button type="button" onClick={() => setOpen((prev) => !prev)} className="text-amber-700 underline hover:text-amber-900">
          {open ? 'Hide' : 'Show'}
        </button>
      </div>
      {open && (
        <ul className="mt-3 space-y-1">
          {data.variants.map((v) => (
            <li key={v.variantId} className="flex items-center justify-between gap-4 text-amber-900">
              <span>
                {canEdit
                  ? <Link href={`/admin/products/${v.productId}`} className="underline hover:no-underline">{v.productTitle}</Link>
                  : v.productTitle
                }
                {' — '}{v.variantName} ({v.sku})
              </span>
              <span className="shrink-0 font-semibold">{v.stock} left</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  draft: '#6b7280',
  archived: '#9333ea',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.75rem', fontWeight: 600, color,
      background: `${color}18`, borderRadius: 999,
      padding: '2px 10px', textTransform: 'capitalize'
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function ProductsList({ user }: { user: AdminSessionUser }) {
  const [data, setData] = useState<ProductListPayload | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState('all');
  const [page, setPage] = useState(1);

  const canEdit = user.permissions.includes('store:edit');

  useEffect(() => {
    fetch('/api/admin/product-categories')
      .then((res) => res.ok ? res.json() : { categories: [] })
      .then((json) => setCategories((json as { categories: ProductCategory[] }).categories ?? []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), pageSize: '20' });
    if (q) params.set('q', q);
    if (categoryId) params.set('categoryId', categoryId);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) {
      let payload = await res.json() as ProductListPayload;
      if (featured !== 'all') {
        const isFeatured = featured === 'yes';
        payload = { ...payload, products: payload.products.filter((p) => p.featured === isFeatured) };
      }
      setData(payload);
    }
    setLoading(false);
  }, [q, status, categoryId, featured, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await csrfFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  return (
    <div>
      <LowStockBanner canEdit={canEdit} />

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.75rem', alignItems: 'end', marginBottom: '1.25rem' }}>
        <input
          type="search"
          placeholder="Search by title or slug…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="admin-input"
          style={{ margin: 0 }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="admin-select" style={{ margin: 0, width: 'auto' }}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} className="admin-select" style={{ margin: 0, width: 'auto' }}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select value={featured} onChange={(e) => { setFeatured(e.target.value); setPage(1); }} className="admin-select" style={{ margin: 0, width: 'auto' }}>
          <option value="all">All</option>
          <option value="yes">Featured only</option>
          <option value="no">Not featured</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : !data?.products.length ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>No products found.</p>
          {canEdit && (
            <Link href="/admin/products/new" style={{ display: 'inline-block', background: '#21385d', color: '#fff', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
              Create first product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.82rem', color: '#6b7280' }}>
            {data.meta.total} product{data.meta.total !== 1 ? 's' : ''}
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 52 }}></th>
                <th>Product</th>
                <th>Status</th>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Featured</th>
                <th>Updated</th>
                {canEdit && <th style={{ width: 120 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => {
                const thumb = product.images?.[0];
                const cat = categories.find((c) => c.id === product.categoryId);
                return (
                  <tr key={product.id}>
                    <td style={{ padding: '6px 8px' }}>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.title}
                          style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 42, height: 42, borderRadius: 6, border: '1px dashed #d1d5db', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#d1d5db' }}>
                          ◻
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <Link href={`/admin/products/${product.id}`} style={{ fontWeight: 600, color: '#111827' }}>
                          {product.title}
                        </Link>
                        {product.shortDescription && (
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.shortDescription}
                          </div>
                        )}
                      </div>
                    </td>
                    <td><StatusBadge status={product.status} /></td>
                    <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{cat?.name ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>{product.featured ? '⭐' : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={{ color: '#9ca3af', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {new Date(product.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link href={`/admin/products/${product.id}`} className="admin-btn-sm admin-btn-primary">
                            Edit
                          </Link>
                          <button type="button" className="admin-btn-sm admin-btn-danger" onClick={() => handleDelete(product.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination" style={{ marginTop: '1rem' }}>
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
