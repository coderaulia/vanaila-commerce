'use client';

import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { Coupon } from '@/features/commerce/types';
import { csrfFetch } from '@/lib/clientCsrf';

const empty: Partial<Coupon> = {
  code: '',
  type: 'percentage',
  value: 0,
  minOrderAmount: null,
  maxUses: null,
  active: true,
  startsAt: null,
  expiresAt: null
};

function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<Partial<Coupon>>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/coupons');
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(empty); setError(''); setNotice(''); };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setNotice('');

    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/coupons/${form.id}` : '/api/admin/coupons';

    const res = await csrfFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    setSaving(false);
    if (!res.ok) { setError('Failed to save coupon.'); return; }

    const data = await res.json();
    setForm(data.coupon);
    setNotice(form.id ? 'Coupon updated.' : 'Coupon created.');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    const res = await csrfFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (!res.ok) { setError('Failed to delete.'); return; }
    if (form.id === id) reset();
    setNotice('Coupon deleted.');
    load();
  };

  const toggleActive = async (coupon: Coupon) => {
    const res = await csrfFetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active })
    });
    if (res.ok) load();
  };

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div className="admin-form-grid">
      <div className="admin-form-section">
        <h3>{form.id ? 'Edit Coupon' : 'New Coupon'}</h3>
        {error && <p className="admin-error">{error}</p>}
        {notice && <p className="admin-notice">{notice}</p>}

        <div className="admin-form-row">
          <div className="admin-form-section">
            <label className="admin-label">Code</label>
            <input
              type="text"
              className="admin-input"
              value={form.code ?? ''}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER20"
            />
          </div>

          <div className="admin-form-section">
            <label className="admin-label">Type</label>
            <select
              className="admin-select"
              value={form.type ?? 'percentage'}
              onChange={(e) => setForm({ ...form, type: e.target.value as Coupon['type'] })}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rp)</option>
            </select>
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-section">
            <label className="admin-label">
              Value {form.type === 'percentage' ? '(%)' : '(Rp)'}
            </label>
            <input
              type="number"
              className="admin-input"
              value={form.value ?? 0}
              min={0}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
            />
          </div>

          <div className="admin-form-section">
            <label className="admin-label">Min Order (Rp, optional)</label>
            <input
              type="number"
              className="admin-input"
              value={form.minOrderAmount ?? ''}
              min={0}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value ? Number(e.target.value) : null })}
              placeholder="No minimum"
            />
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-section">
            <label className="admin-label">Max Uses (optional)</label>
            <input
              type="number"
              className="admin-input"
              value={form.maxUses ?? ''}
              min={1}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : null })}
              placeholder="Unlimited"
            />
          </div>

          <div className="admin-form-section">
            <label className="admin-label">
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />{' '}
              Active
            </label>
          </div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-section">
            <label className="admin-label">Starts At (optional)</label>
            <input
              type="datetime-local"
              className="admin-input"
              value={form.startsAt ? form.startsAt.slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </div>

          <div className="admin-form-section">
            <label className="admin-label">Expires At (optional)</label>
            <input
              type="datetime-local"
              className="admin-input"
              value={form.expiresAt ? form.expiresAt.slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : form.id ? 'Update Coupon' : 'Create Coupon'}
          </button>
          {form.id && (
            <button type="button" className="admin-btn" onClick={reset}>
              New Coupon
            </button>
          )}
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Coupons ({coupons.length})</h3>
        {!coupons.length ? (
          <p className="muted">No coupons yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Uses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td><code>{coupon.code}</code></td>
                  <td>{coupon.type}</td>
                  <td>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `Rp ${coupon.value.toLocaleString('id-ID')}`}
                  </td>
                  <td>{coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}</td>
                  <td>
                    <span className={`admin-chip ${coupon.active ? 'admin-chip-active' : 'admin-chip-archived'}`}>
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        onClick={() => { setForm(coupon); setError(''); setNotice(''); }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        onClick={() => toggleActive(coupon)}
                      >
                        {coupon.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(coupon.id)}
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

export default function AdminCouponsPage() {
  return (
    <AdminShell title="Coupons" description="Manage discount coupons">
      {() => <CouponsManager />}
    </AdminShell>
  );
}
