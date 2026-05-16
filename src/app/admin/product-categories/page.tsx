'use client';

import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { ProductCategory } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

const empty: Partial<ProductCategory> = { name: '', slug: '', description: '' };

function ProductCategoriesManager() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [form, setForm] = useState<Partial<ProductCategory>>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/product-categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(empty); setError(''); setNotice(''); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    setError('');
    setNotice('');

    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/product-categories/${form.id}` : '/api/admin/product-categories';

    const res = await csrfFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug })
    });

    setSaving(false);
    if (!res.ok) { setError('Failed to save category.'); return; }

    const data = await res.json();
    setForm(data.category);
    setNotice(form.id ? 'Category updated.' : 'Category created.');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product category?')) return;
    const res = await csrfFetch(`/api/admin/product-categories/${id}`, { method: 'DELETE' });
    if (!res.ok) { setError('Failed to delete.'); return; }
    if (form.id === id) reset();
    setNotice('Category deleted.');
    load();
  };

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div className="admin-form-grid">
      <div className="admin-form-section">
        <h3>{form.id ? 'Edit Category' : 'New Category'}</h3>
        {error && <p className="admin-error">{error}</p>}
        {notice && <p className="admin-notice">{notice}</p>}

        <label className="admin-label">Name</label>
        <input
          type="text"
          className="admin-input"
          value={form.name ?? ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Category name"
        />

        <label className="admin-label">Slug</label>
        <input
          type="text"
          className="admin-input"
          value={form.slug ?? ''}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="auto-generated"
        />

        <label className="admin-label">Description</label>
        <textarea
          className="admin-textarea"
          rows={3}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={saving || !form.name}
          >
            {saving ? 'Saving...' : form.id ? 'Update' : 'Create'}
          </button>
          {form.id && (
            <button type="button" className="admin-btn" onClick={reset}>
              New Category
            </button>
          )}
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Categories ({categories.length})</h3>
        {!categories.length ? (
          <p className="muted">No product categories yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td><span className="admin-chip admin-chip-muted">{cat.slug}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        onClick={() => { setForm(cat); setError(''); setNotice(''); }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(cat.id)}
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
    </div>
  );
}

export default function AdminProductCategoriesPage() {
  return (
    <AdminShell title="Product Categories" description="Manage categories for your store products">
      {() => <ProductCategoriesManager />}
    </AdminShell>
  );
}
