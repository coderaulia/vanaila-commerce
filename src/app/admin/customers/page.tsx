'use client';

import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import type { Customer } from '@/features/commerce/types';

type CustomerListPayload = {
  customers: Customer[];
  meta: { total: number; page: number; pageSize: number };
};

function CustomersList() {
  const [data, setData] = useState<CustomerListPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (q) params.set('q', q);
    const res = await fetch(`/api/admin/customers?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [q, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  return (
    <div>
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="admin-input"
        />
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : !data?.customers.length ? (
        <p className="muted">No customers found.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '—'}</td>
                  <td>{customer.totalOrders}</td>
                  <td>Rp {customer.totalSpent.toLocaleString('id-ID')}</td>
                  <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
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

export default function AdminCustomersPage() {
  return (
    <AdminShell title="Customers" description="View customer information">
      {() => <CustomersList />}
    </AdminShell>
  );
}
