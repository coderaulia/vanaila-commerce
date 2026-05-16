'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, LockKeyhole, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { clearCart, setCouponCode as persistCouponCode, useCart } from '@/features/commerce/cartStore';
import type { PaymentMethod } from '@/features/commerce/types';

type CheckoutForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
};

type CheckoutResponse = {
  error?: string;
  order?: { id: string };
  receiptToken?: string;
  paymentUrl?: string;
};

const initialForm: CheckoutForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  notes: ''
};

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

type CheckoutPageClientProps = {
  midtransEnabled: boolean;
  manualTransferEnabled: boolean;
  freeShippingThreshold: number;
  minOrderAmount: number;
};

export function CheckoutPageClient({ midtransEnabled, manualTransferEnabled, freeShippingThreshold, minOrderAmount }: CheckoutPageClientProps) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    manualTransferEnabled ? 'manual_transfer' : 'midtrans'
  );
  const [couponCode, setCouponCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const cart = useCart();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCouponCodeInput(cart.couponCode ?? '');
  }, [cart.couponCode]);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + (item.variant?.price ?? 0) * item.quantity,
    0
  );
  const hasCompletePricing = cart.items.every((item) => item.variant);

  const updateField = (field: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateCoupon = (value: string) => {
    setCouponCodeInput(value);
    persistCouponCode(value.trim() || null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cart.items.length === 0) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity
          })),
          customer: form,
          paymentMethod,
          couponCode: couponCode.trim() || undefined,
          notes: form.notes.trim() || undefined
        })
      });

      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok) {
        setError(data.error || 'Checkout failed. Please review your cart and try again.');
        setSubmitting(false);
        return;
      }

      if (!data.order?.id) {
        setError('Checkout completed, but the receipt could not be opened. Please contact support.');
        setSubmitting(false);
        return;
      }

      clearCart();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      const tokenParam = data.receiptToken ? `&token=${encodeURIComponent(data.receiptToken)}` : '';
      router.push(`/shop/order/${data.order.id}?status=pending${tokenParam}`);
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-[56vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true">
        <div className="h-8 w-36 bg-gray-100 animate-pulse rounded-sm" />
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-96 bg-gray-100 animate-pulse rounded-sm" />
          <div className="h-64 bg-gray-100 animate-pulse rounded-sm" />
        </div>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="min-h-[56vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="flex min-h-[44vh] flex-col items-center justify-center border border-gray-100 px-4 py-16 text-center">
          <ShoppingBag aria-hidden="true" className="h-16 w-16 text-gray-200" />
          <h1 className="mt-6 text-2xl font-bold uppercase text-gray-950">Your cart is empty</h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Add items to your cart before starting checkout.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-wide text-white no-underline transition-opacity hover:opacity-80"
            >
              Browse the store
            </Link>
            <Link
              href="/cart"
              className="inline-flex h-12 items-center justify-center border border-gray-200 px-8 text-sm font-semibold uppercase tracking-wide text-gray-900 no-underline transition-colors hover:border-black"
            >
              View cart
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[56vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 no-underline transition-colors hover:text-black"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to cart
        </Link>
        <h1 className="mt-4 text-3xl font-bold uppercase text-black">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <section className="border border-gray-100 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950">Contact and Shipping</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Full name
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="mt-2 h-11 w-full border border-gray-200 px-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  className="mt-2 h-11 w-full border border-gray-200 px-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Phone
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="mt-2 h-11 w-full border border-gray-200 px-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                City
                <input
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  className="mt-2 h-11 w-full border border-gray-200 px-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Province
                <input
                  type="text"
                  required
                  autoComplete="address-level1"
                  value={form.province}
                  onChange={(event) => updateField('province', event.target.value)}
                  className="mt-2 h-11 w-full border border-gray-200 px-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Postal code
                <input
                  type="text"
                  required
                  autoComplete="postal-code"
                  value={form.postalCode}
                  onChange={(event) => updateField('postalCode', event.target.value)}
                  className="mt-2 h-11 w-full border border-gray-200 px-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                Address
                <textarea
                  required
                  autoComplete="street-address"
                  rows={3}
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  className="mt-2 w-full resize-none border border-gray-200 px-3 py-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  className="mt-2 w-full resize-none border border-gray-200 px-3 py-3 text-sm text-gray-950 outline-none transition-colors focus:border-black"
                />
              </label>
            </div>
          </section>

          <section className="border border-gray-100 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950">Payment</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {manualTransferEnabled && (
                <label
                  className={`flex min-h-24 cursor-pointer gap-3 border p-4 transition-colors ${
                    paymentMethod === 'manual_transfer' ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="manual_transfer"
                    checked={paymentMethod === 'manual_transfer'}
                    onChange={() => setPaymentMethod('manual_transfer')}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-950">Bank transfer</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      Place the order now and complete payment after confirmation.
                    </span>
                  </span>
                </label>
              )}
              {midtransEnabled && (
                <label
                  className={`flex min-h-24 cursor-pointer gap-3 border p-4 transition-colors ${
                    paymentMethod === 'midtrans' ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="midtrans"
                    checked={paymentMethod === 'midtrans'}
                    onChange={() => setPaymentMethod('midtrans')}
                    className="mt-1"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                      <CreditCard aria-hidden="true" className="h-4 w-4" />
                      Online payment
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500">
                      Pay securely via Midtrans.
                    </span>
                  </span>
                </label>
              )}
            </div>
          </section>

          <section className="border border-gray-100 p-5 sm:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950">Coupon</h2>
            <input
              type="text"
              value={couponCode}
              onChange={(event) => updateCoupon(event.target.value)}
              placeholder="Coupon code"
              className="mt-5 h-11 w-full border border-gray-200 px-3 text-sm uppercase text-gray-950 outline-none transition-colors placeholder:normal-case focus:border-black"
            />
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 bg-black px-6 text-sm font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LockKeyhole aria-hidden="true" className="h-4 w-4" />
            {submitting ? 'Processing' : 'Place order'}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Order summary">
          <div className="border border-gray-100 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950">Order Summary</h2>
            <div className="mt-5 space-y-4">
              {cart.items.map((item) => {
                const title = item.product?.title || item.variant?.name || 'Product';
                const image = item.product?.images?.[0];
                const lineTotal = item.variant ? item.variant.price * item.quantity : null;

                return (
                  <div key={item.variantId} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      {image ? (
                        <img src={image} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag aria-hidden="true" className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-gray-950">{title}</p>
                        <p className="shrink-0 text-sm font-semibold text-gray-950">
                          {lineTotal == null ? 'TBD' : formatCurrency(lineTotal)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Qty {item.quantity}
                        {item.variant?.name && item.variant.name !== title ? ` / ${item.variant.name}` : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <dl className="mt-6 space-y-4 border-t border-gray-100 pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Subtotal</dt>
                <dd className="font-semibold text-gray-950">
                  {hasCompletePricing ? formatCurrency(subtotal) : 'Calculated at checkout'}
                </dd>
              </div>
              {minOrderAmount > 0 && hasCompletePricing && subtotal < minOrderAmount && (
                <p role="alert" className="text-xs text-red-600">
                  Minimum order is {formatCurrency(minOrderAmount)}.
                </p>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Shipping</dt>
                <dd className="font-semibold text-gray-950">
                  {freeShippingThreshold > 0 && hasCompletePricing && subtotal >= freeShippingThreshold
                    ? <span className="text-green-700">Free</span>
                    : 'Calculated at checkout'}
                </dd>
              </div>
              {freeShippingThreshold > 0 && hasCompletePricing && subtotal < freeShippingThreshold && (
                <p className="text-xs text-gray-500">
                  Add {formatCurrency(freeShippingThreshold - subtotal)} more for free shipping.
                </p>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
