'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { Product, ProductCategory, ProductVariant } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

function ProductEditor() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);

  const fetchProduct = useCallback(async () => {
    const [prodRes, catRes] = await Promise.all([
      fetch(`/api/admin/products/${id}`),
      fetch('/api/admin/product-categories')
    ]);
    if (prodRes.ok) {
      const data = await prodRes.json();
      setProduct(data.product);
    } else {
      setError('Product not found');
    }
    if (catRes.ok) {
      const data = await catRes.json();
      setCategories(data.categories);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    setError('');
    setNotice('');

    const res = await csrfFetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      const data = await res.json();
      setProduct(data.product);
      setNotice('Product saved.');
    } else {
      setError('Failed to save');
    }
    setSaving(false);
  };

  const handleAddImage = () => {
    if (!product || !newImageUrl.trim()) return;
    setProduct({ ...product, images: [...product.images, newImageUrl.trim()] });
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (!product) return;
    setProduct({ ...product, images: product.images.filter((_, i) => i !== index) });
  };

  const handleAddVariant = async () => {
    if (!product) return;
    const res = await csrfFetch(`/api/admin/products/${id}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, name: 'New Variant', price: 0, stock: 0 })
    });
    if (res.ok) fetchProduct();
  };

  const handleSaveVariant = async () => {
    if (!editingVariant) return;
    setVariantSaving(true);
    const res = await csrfFetch(`/api/admin/products/${id}/variants`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingVariant)
    });
    if (res.ok) {
      setEditingVariant(null);
      fetchProduct();
    }
    setVariantSaving(false);
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return;
    const res = await csrfFetch(`/api/admin/products/${id}/variants?variantId=${variantId}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchProduct();
  };

  if (loading) return <p className="muted">Loading...</p>;
  if (error && !product) return <p className="admin-error">{error}</p>;
  if (!product) return null;

  return (
    <div className="admin-form-grid">
      {error && <p className="admin-error">{error}</p>}
      {notice && <p className="admin-notice">{notice}</p>}

      {/* Core Fields */}
      <div className="admin-form-row">
        <div className="admin-form-section" style={{ flex: 2 }}>
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

      {/* Status + Meta */}
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
          <label className="admin-label">Category</label>
          <select
            className="admin-select"
            value={product.categoryId ?? ''}
            onChange={(e) => setProduct({ ...product, categoryId: e.target.value || null })}
          >
            <option value="">— No category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="admin-form-section">
          <label className="admin-label">Sort Order</label>
          <input
            type="number"
            className="admin-input"
            value={product.sortOrder}
            onChange={(e) => setProduct({ ...product, sortOrder: Number(e.target.value) })}
          />
        </div>

        <div className="admin-form-section" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label className="admin-label" style={{ marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={product.featured}
              onChange={(e) => setProduct({ ...product, featured: e.target.checked })}
            />{' '}
            Featured
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="admin-form-section">
        <h3>Images</h3>
        {product.images.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {product.images.map((img, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                <img
                  src={img}
                  alt={`Product image ${i + 1}`}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                    borderRadius: '50%', background: '#ef4444', color: 'white',
                    border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="url"
            className="admin-input"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://... or /uploads/..."
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="admin-btn"
            onClick={handleAddImage}
            disabled={!newImageUrl.trim()}
          >
            Add Image
          </button>
        </div>
      </div>

      {/* SEO */}
      <div className="admin-form-section">
        <h3>SEO</h3>
        <label className="admin-label">SEO Title</label>
        <input
          type="text"
          className="admin-input"
          value={product.seoTitle}
          onChange={(e) => setProduct({ ...product, seoTitle: e.target.value })}
          placeholder="Defaults to product title"
        />
        <label className="admin-label" style={{ marginTop: '0.75rem' }}>SEO Description</label>
        <textarea
          className="admin-textarea"
          rows={3}
          value={product.seoDescription}
          onChange={(e) => setProduct({ ...product, seoDescription: e.target.value })}
          placeholder="Defaults to short description"
        />
      </div>

      {/* Variants */}
      <div className="admin-form-section">
        <div className="admin-form-section-header">
          <h3>Variants</h3>
          <button type="button" className="admin-btn-sm admin-btn-primary" onClick={handleAddVariant}>
            Add Variant
          </button>
        </div>

        {!product.variants?.length ? (
          <p className="muted">No variants yet. Add one to set pricing and stock.</p>
        ) : editingVariant ? (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '1rem', marginTop: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.75rem' }}>Edit Variant</h4>
            <div className="admin-form-row">
              <div className="admin-form-section">
                <label className="admin-label">Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingVariant.name}
                  onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-label">SKU</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingVariant.sku}
                  onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-section">
                <label className="admin-label">Price (Rp)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={editingVariant.price}
                  min={0}
                  onChange={(e) => setEditingVariant({ ...editingVariant, price: Number(e.target.value) })}
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-label">Compare At Price (Rp)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={editingVariant.compareAtPrice ?? ''}
                  min={0}
                  onChange={(e) => setEditingVariant({ ...editingVariant, compareAtPrice: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Original price (for sale display)"
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-section">
                <label className="admin-label">Stock</label>
                <input
                  type="number"
                  className="admin-input"
                  value={editingVariant.stock}
                  min={0}
                  onChange={(e) => setEditingVariant({ ...editingVariant, stock: Number(e.target.value) })}
                />
              </div>
              <div className="admin-form-section">
                <label className="admin-label">Weight (g)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={editingVariant.weight ?? ''}
                  min={0}
                  onChange={(e) => setEditingVariant({ ...editingVariant, weight: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleSaveVariant}
                disabled={variantSaving}
              >
                {variantSaving ? 'Saving...' : 'Save Variant'}
              </button>
              <button type="button" className="admin-btn" onClick={() => setEditingVariant(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td><code>{v.sku}</code></td>
                  <td>
                    Rp {v.price.toLocaleString('id-ID')}
                    {v.compareAtPrice && (
                      <span style={{ marginLeft: 6, textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.85em' }}>
                        Rp {v.compareAtPrice.toLocaleString('id-ID')}
                      </span>
                    )}
                  </td>
                  <td>{v.stock}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        onClick={() => setEditingVariant(v)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-danger"
                        onClick={() => handleDeleteVariant(v.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
