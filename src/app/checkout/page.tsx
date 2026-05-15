'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { modules } from '@/config/modules';
import { useCart, clearCart } from '@/features/commerce/cartStore';
import type { PaymentMethod } from '@/features/commerce/types';

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('manual_transfer');
  const [couponCode, setCouponCode] = useState(cart.couponCode || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!modules.ENABLE_STORE_MODULE) return null;

  if (cart.items.length === 0) {
    return (
      <main className="checkout-page">
        <h1>Checkout</h1>
        <p>Your cart is empty. Add items before checking out.</p>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: form,
          paymentMethod,
          couponCode: couponCode || undefined,
          notes: form.notes || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Checkout failed');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      clearCart();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        router.push(`/shop/order/${data.order.id}?status=pending`);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <main className="checkout-page">
      <h1>Checkout</h1>

      {error && <p className="checkout-error">{error}</p>}

      <form onSubmit={handleSubmit} className="checkout-form">
        <section className="checkout-section">
          <h2>Contact & Shipping</h2>
          <div className="checkout-fields">
            <input type="text" placeholder="Full Name *" required value={form.name} onChange={(e) => updateField('name', e.target.value)} className="checkout-input" />
            <input type="email" placeholder="Email *" required value={form.email} onChange={(e) => updateField('email', e.target.value)} className="checkout-input" />
            <input type="tel" placeholder="Phone *" required value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="checkout-input" />
            <textarea placeholder="Address *" required value={form.address} onChange={(e) => updateField('address', e.target.value)} className="checkout-input" rows={2} />
            <input type="text" placeholder="City *" required value={form.city} onChange={(e) => updateField('city', e.target.value)} className="checkout-input" />
            <input type="text" placeholder="Province *" required value={form.province} onChange={(e) => updateField('province', e.target.value)} className="checkout-input" />
            <input type="text" placeholder="Postal Code *" required value={form.postalCode} onChange={(e) => updateField('postalCode', e.target.value)} className="checkout-input" />
            <textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} className="checkout-input" rows={2} />
          </div>
        </section>

        <section className="checkout-section">
          <h2>Payment Method</h2>
          <div className="checkout-payment-options">
            <label className="checkout-radio">
              <input type="radio" name="payment" value="manual_transfer" checked={paymentMethod === 'manual_transfer'} onChange={() => setPaymentMethod('manual_transfer')} />
              <span>Manual Bank Transfer</span>
            </label>
            <label className="checkout-radio">
              <input type="radio" name="payment" value="midtrans" checked={paymentMethod === 'midtrans'} onChange={() => setPaymentMethod('midtrans')} />
              <span>Online Payment (Midtrans)</span>
            </label>
          </div>
        </section>

        <section className="checkout-section">
          <h2>Coupon</h2>
          <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="checkout-input" />
        </section>

        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
          {submitting ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </main>
  );
}
