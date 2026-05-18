'use client';

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
  pending_payment: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  refunded: 'bg-red-50 text-red-600 border-red-200',
};

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
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
        const ordersResponse = await fetch('/api/account/orders');
        const ordersData = ordersResponse.ok
          ? await ordersResponse.json() as { orders: Order[] }
          : { orders: [] };

        if (cancelled) return;
        setProfile(me.customer);
        setOrders(ordersData.orders ?? []);
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
    <div className="min-h-[60vh] px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">My account</h1>
            <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/account/profile"
              className="inline-flex h-10 items-center rounded-full border border-gray-200 px-4 text-sm font-medium hover:border-primary transition-colors"
            >
              Edit profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-10 items-center rounded-full border border-gray-200 px-4 text-sm font-medium text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        {/* Orders */}
        <h2 className="text-lg font-semibold mb-5">Orders</h2>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-gray-500 text-sm">No orders yet.</p>
            <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="font-semibold text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="text-sm font-semibold">{rupiah(order.total)}</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {order.items.map(item => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.productTitle}
                        {item.variantName && item.variantName !== 'Default' && (
                          <span className="text-gray-400"> · {item.variantName}</span>
                        )}
                      </span>
                      <span className="text-gray-500 text-xs ml-4 shrink-0">
                        {item.quantity}× {rupiah(item.unitPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
