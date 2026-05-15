'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { Product } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

function ProductEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProduct = useCallback(async () => {
    const res = await fetch(`/api/admin/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      setProduct(data.product);
    } else {
      setError('Product not found');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    setError('');

    const res = await csrfFetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      const data = await res.json();
      setProduct(data.product);
    } else {
      setError('Failed to save');
    }
    setSaving(false);
  };

  const handleAddVariant = async () => {
    if (!product) return;
    const res = await csrfFetch(`/api/admin/products/${id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, name: 'New Variant', price: 0 })
    });
    if (res.ok) fetchProduct();
  };

  if (loading) return <p className="muted">Loading...</p>;
  if (error && !product) return <p className="admin-error">{error}</p>;
  if (!product) return null;

  return (
    <div className="admin-form-grid">
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-form-section">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          value={product.title}
          onChange={(e) => setProduct({ ...product, title: e.target.value })}
        />
      </div>

      <div className="admin-form-section">
        <label className="admin-label">Slug</label>
        <input
          type="text"
          className="admin-input"
          value={product.slug}
          onChange={(e) => setProduct({ ...product, slug: e.target.value })}
        />
      </div>

      <div className="admin-form-section">
        <label className="admin-label">Short Description</label>
        <input
          type="text"
          className="admin-input"
          value={product.shortDescription}
          onChange={(e) => setProduct({ ...product, shortDescription: e.target.value })}
        />
      </div>

      <div className="admin-form-section">
        <label className="admin-label">Description</label>
        <textarea
          className="admin-textarea"
          rows={6}
          value={product.description}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
        />
      </div>

      <div className="admin-form-row">
        <div className="admin-form-section">
          <label className="admin-label">Status</label>
          <select
            className="admin-select"
            value={product.status}
            onChange={(e) => setProduct({ ...product, status: e.target.value as Product['status'] })}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="admin-form-section">
          <label className="admin-label">
            <input
              type="checkbox"
              checked={product.featured}
              onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
            />{' '}
            Featured
          </label>
        </div>
      </div>

      {/* Variants */}
      <div className="admin-form-section">
        <div className="admin-form-section-header">
          <h3>Variants</h3>
          <button type="button" className="admin-btn-sm admin-btn-primary" onClick={handleAddVariant}>
            Add Variant
          </button>
        </div>

        {product.variants?.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td><code>{v.sku}</code></td>
                  <td>Rp {v.price.toLocaleString('id-ID')}</td>
                  <td>{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No variants yet. Add one to set pricing and stock.</p>
        )}
      </div>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" className="admin-btn" onClick={() => router.push('/admin/products')}>
          Back to Products
        </button>
      </div>
    </div>
  );
}

export default function AdminProductEditPage() {
  return (
    <AdminShell title="Edit Product">
      {() => <ProductEditor />}
    </AdminShell>
  );
}
