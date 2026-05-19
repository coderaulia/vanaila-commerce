'use client';

import { ArrowLeft, MessageSquareText, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CustomerReview = {
  id: string;
  productTitle: string;
  productSlug: string;
  rating: number;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

const statusLabel: Record<CustomerReview['status'], string> = {
  pending: 'Pending moderation',
  approved: 'Published',
  rejected: 'Not published',
};

export default function AccountReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews(): Promise<void> {
      try {
        const response = await fetch('/api/account/reviews');
        if (response.status === 401) {
          router.replace('/account/login');
          return;
        }
        if (!response.ok) return;
        const data = await response.json() as { reviews: CustomerReview[] };
        if (!cancelled) setReviews(data.reviews ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="store-account-page" aria-busy="true">
        <div className="store-account-container">
          <div className="store-account-empty">
            <div className="h-8 w-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="store-account-page">
      <div className="store-account-container">
        <Link href="/account" className="store-account-link">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          My account
        </Link>

        <div className="store-account-header">
          <div>
            <p className="store-account-eyebrow">Customer feedback</p>
            <h1 className="store-account-title">My reviews</h1>
            <p className="store-account-muted">Track your submitted product reviews and moderation status.</p>
          </div>
          <Link href="/shop" className="store-account-btn store-account-btn-primary">
            Review another product
          </Link>
        </div>

        {reviews.length === 0 ? (
          <section className="store-account-empty">
            <MessageSquareText aria-hidden="true" className="h-12 w-12" />
            <p>You have not written any reviews yet.</p>
            <Link href="/shop" className="store-account-btn store-account-btn-primary">
              Browse purchased products
            </Link>
          </section>
        ) : (
          <section className="store-account-list" aria-label="Submitted reviews">
            {reviews.map((review) => (
              <article key={review.id} className="store-account-card">
                <div className="store-account-card-head">
                  <div>
                    <Link href={`/shop/${review.productSlug}`} className="store-account-card-title">
                      {review.productTitle}
                    </Link>
                    <p className="store-account-muted">
                      {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`store-account-chip store-account-chip-${review.status}`}>
                    {statusLabel[review.status]}
                  </span>
                </div>
                <p className="store-account-stars" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      aria-hidden="true"
                      className={`h-4 w-4 ${index < review.rating ? 'fill-current' : ''}`}
                    />
                  ))}
                </p>
                <p className="store-account-review-body">{review.body}</p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
