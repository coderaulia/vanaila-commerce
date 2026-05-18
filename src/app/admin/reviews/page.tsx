'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { AdminShell } from '@/components/AdminShell';
import { csrfFetch } from '@/lib/clientCsrf';
import type { ProductReview, ProductReviewStatus } from '@/features/commerce/types';

type AdminReview = ProductReview & {
  productTitle: string;
  productSlug: string;
};

type ReviewPayload = {
  reviews: AdminReview[];
  meta: { total: number; page: number; pageSize: number };
};

function ReviewsQueue() {
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [status, setStatus] = useState<'all' | ProductReviewStatus>('pending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ status, page: String(page), pageSize: '20' });
    const res = await fetch(`/api/admin/reviews?${params}`);
    if (res.ok) {
      setData(await res.json());
    } else {
      setError('Unable to load reviews.');
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateStatus = async (id: string, nextStatus: ProductReviewStatus) => {
    const res = await csrfFetch('/api/admin/reviews', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: nextStatus })
    });
    if (res.ok) fetchReviews();
  };

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  return (
    <div>
      <div className="admin-toolbar">
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value as 'all' | ProductReviewStatus); setPage(1); }}
          className="admin-select"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All Reviews</option>
        </select>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : !data?.reviews.length ? (
        <p className="muted">No reviews found.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <Link href={`/admin/products/${review.productId}`}>{review.productTitle}</Link>
                    <br />
                    <Link href={`/shop/${review.productSlug}`} className="muted">View product</Link>
                  </td>
                  <td>
                    <strong>{review.authorName}</strong>
                    <br />
                    <span className="muted">{review.authorEmail}</span>
                  </td>
                  <td>{review.rating} / 5</td>
                  <td style={{ maxWidth: 360 }}>{review.body}</td>
                  <td>
                    <span className={`admin-chip admin-chip-${review.status}`}>{review.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-primary"
                        disabled={review.status === 'approved'}
                        onClick={() => updateStatus(review.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-danger"
                        disabled={review.status === 'rejected'}
                        onClick={() => updateStatus(review.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 ? (
            <div className="admin-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <AdminShell title="Reviews" description="Moderate product reviews before they appear in the shop">
      {() => <ReviewsQueue />}
    </AdminShell>
  );
}
