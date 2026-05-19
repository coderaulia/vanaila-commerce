'use client';

import { Heart, MessageSquareText, Package, PenLine, ShoppingBag, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CustomerProfile = {
  id: string;
  email: string;
  name: string;
};

type OrderItem = {
  id: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type Review = {
  id: string;
  status: string;
};

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'store-account-chip store-account-chip-warn',
  paid: 'store-account-chip store-account-chip-info',
  processing: 'store-account-chip store-account-chip-info',
  shipped: 'store-account-chip store-account-chip-info',
  delivered: 'store-account-chip store-account-chip-success',
  cancelled: 'store-account-chip',
  refunded: 'store-account-chip store-account-chip-danger',
};

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount(): Promise<void> {
      try {
        const meResponse = await fetch('/api/account/me');
        if (meResponse.status === 401) {
          router.replace('/account/login');
          return;
        }
        if (!meResponse.ok) return;

        const me = await meResponse.json() as { customer: CustomerProfile };
        const [ordersResponse, reviewsResponse] = await Promise.all([
          fetch('/api/account/orders'),
          fetch('/api/account/reviews'),
        ]);
        const ordersData = ordersResponse.ok ? await ordersResponse.json() as { orders: Order[] } : { orders: [] };
        const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() as { reviews: Review[] } : { reviews: [] };

        if (cancelled) return;
        setProfile(me.customer);
        setOrders(ordersData.orders ?? []);
        setReviews(reviewsData.reviews ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/account/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <main className="store-account-page">
      <div className="store-account-container">
        <div className="store-account-header">
          <div>
            <p className="store-account-eyebrow">Customer dashboard</p>
            <h1 className="store-account-title">My account</h1>
            <p className="store-account-muted">{profile.email}</p>
          </div>
          <div className="store-account-actions">
            <Link href="/account/profile" className="store-account-btn store-account-btn-secondary">
              <PenLine aria-hidden="true" className="h-4 w-4" />
              Edit profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="store-account-btn store-account-btn-secondary"
            >
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        <section className="store-account-shortcuts" aria-label="Account shortcuts">
          {[
            { href: '#orders', label: 'Orders', value: orders.length, icon: Package },
            { href: '/wishlist', label: 'Wishlist', value: 'Saved items', icon: Heart },
            { href: '/account/reviews', label: 'My reviews', value: reviews.length, icon: MessageSquareText },
            { href: '/account/profile', label: 'Profile', value: 'Address', icon: UserRound },
            { href: '/shop', label: 'Shop', value: 'Browse', icon: ShoppingBag },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} className="store-account-shortcut">
                <span className="store-account-shortcut-icon">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span>
                  <span className="store-account-shortcut-label">{item.label}</span>
                  <span className="store-account-shortcut-value">{item.value}</span>
                </span>
              </Link>
            );
          })}
        </section>

        <section id="orders" className="store-account-section">
        <div className="store-account-section-head">
          <div>
            <p className="store-account-eyebrow">Purchase history</p>
            <h2>Orders</h2>
          </div>
          <Link href="/shop" className="store-account-link">Continue shopping</Link>
        </div>
        {orders.length === 0 ? (
          <div className="store-account-empty">
            <p>No orders yet.</p>
            <Link href="/shop" className="store-account-btn store-account-btn-primary">
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="store-account-list">
            {orders.map(order => (
              <article key={order.id} className="store-account-card">
                <div className="store-account-card-head">
                  <div>
                    <p className="store-account-card-title">#{order.orderNumber}</p>
                    <p className="store-account-muted">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="store-account-card-meta">
                    <span className={STATUS_COLORS[order.status] ?? 'store-account-chip'}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="store-account-total">{rupiah(order.total)}</span>
                  </div>
                </div>

                <ul className="store-account-items">
                  {order.items.map(item => (
                    <li key={item.id}>
                      <span>
                        {item.productTitle}
                        {item.variantName && item.variantName !== 'Default' && (
                          <span className="store-account-muted"> · {item.variantName}</span>
                        )}
                      </span>
                      <span className="store-account-muted">
                        {item.quantity}× {rupiah(item.unitPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
        </section>
      </div>
    </main>
  );
}
