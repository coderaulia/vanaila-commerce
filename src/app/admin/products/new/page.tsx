'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import { csrfFetch } from '@/lib/clientCsrf';

function NewProductForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setSaving(true);
    setError('');

    const res = await csrfFetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, slug: slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/products/${data.product.id}`);
    } else {
      setError('Failed to create product');
    }
    setSaving(false);
  };

  return (
    <div className="admin-form-grid">
      {error && <p className="admin-error">{error}</p>}

      <div className="admin-form-section">
        <label className="admin-label">Title</label>
        <input
          type="text"
          className="admin-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Product title"
        />
      </div>

      <div className="admin-form-section">
        <label className="admin-label">Slug (optional)</label>
        <input
          type="text"
          className="admin-input"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto-generated-from-title"
        />
      </div>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn-primary" onClick={handleCreate} disabled={saving || !title}>
          {saving ? 'Creating...' : 'Create Product'}
        </button>
        <button type="button" className="admin-btn" onClick={() => router.push('/admin/products')}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminNewProductPage() {
  return (
    <AdminShell title="New Product">
      {() => <NewProductForm />}
    </AdminShell>
  );
}
