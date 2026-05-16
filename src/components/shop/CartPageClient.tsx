'use client';

import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { removeFromCart, updateCartQuantity, useCart } from '@/features/commerce/cartStore';

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function CartPageClient() {
  const [mounted, setMounted] = useState(false);
  const cart = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + (item.variant?.price ?? 0) * item.quantity,
    0
  );
  const hasCompletePricing = cart.items.every((item) => item.variant);

  if (!mounted) {
    return (
      <main className="min-h-[56vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-busy="true">
        <div className="h-8 w-40 bg-gray-100 animate-pulse rounded-sm" />
        <div className="mt-10 h-36 bg-gray-100 animate-pulse rounded-sm" />
      </main>
    );
  }

  return (
    <main className="min-h-[56vh] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 no-underline transition-colors hover:text-black"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Continue shopping
          </Link>
          <h1 className="mt-4 text-3xl font-bold uppercase text-black">Shopping Cart</h1>
        </div>
        {cart.totalItems > 0 && (
          <p className="text-sm font-medium text-gray-500">
            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {cart.items.length === 0 ? (
        <section className="flex min-h-[44vh] flex-col items-center justify-center border border-gray-100 px-4 py-16 text-center">
          <ShoppingBag aria-hidden="true" className="h-16 w-16 text-gray-200" />
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Add something you love and it will show up here before checkout.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-wide text-white no-underline transition-opacity hover:opacity-80"
          >
            Browse the store
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4" aria-label="Cart items">
            {cart.items.map((item) => {
              const product = item.product;
              const variant = item.variant;
              const image = product?.images?.[0];
              const title = product?.title || variant?.name || 'Product';
              const lineTotal = variant ? variant.price * item.quantity : null;
              const stock = variant?.stock;
              const canIncrease = typeof stock !== 'number' || item.quantity < stock;
              const options = Object.entries(variant?.options ?? {});

              return (
                <article
                  key={item.variantId}
                  className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border border-gray-100 p-3 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center sm:p-4"
                >
                  <Link
                    href={product?.slug ? `/shop/${product.slug}` : '/shop'}
                    className="aspect-square overflow-hidden bg-gray-100 no-underline"
                  >
                    {image ? (
                      <img src={image} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag aria-hidden="true" className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <Link
                      href={product?.slug ? `/shop/${product.slug}` : '/shop'}
                      className="block truncate text-sm font-semibold text-gray-950 no-underline hover:text-gray-500"
                    >
                      {title}
                    </Link>
                    {variant?.name && variant.name !== title && (
                      <p className="mt-1 text-xs font-medium text-gray-500">{variant.name}</p>
                    )}
                    {options.length > 0 && (
                      <p className="mt-1 text-xs text-gray-400">
                        {options.map(([key, value]) => `${key}: ${value}`).join(' / ')}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex h-10 items-center border border-gray-200" aria-label="Quantity">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                          aria-label={`Decrease quantity for ${title}`}
                          className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          <Minus aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                          disabled={!canIncrease}
                          aria-label={`Increase quantity for ${title}`}
                          className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          <Plus aria-hidden="true" className="h-4 w-4" />
                        </button>
                      </div>
                      {typeof stock === 'number' && stock > 0 && stock <= 5 && (
                        <span className="text-xs font-medium text-red-600">Only {stock} left</span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between border-t border-gray-100 pt-3 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                    <div>
                      {variant ? (
                        <>
                          <p className="text-sm font-semibold text-gray-950">{formatCurrency(lineTotal ?? 0)}</p>
                          <p className="mt-1 text-xs text-gray-400">{formatCurrency(variant.price)} each</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-gray-500">Calculated at checkout</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.variantId)}
                      aria-label={`Remove ${title}`}
                      title="Remove item"
                      className="mt-0 inline-flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:text-red-600 sm:mt-4"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Order summary">
            <div className="border border-gray-100 p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-950">Order Summary</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="font-semibold text-gray-950">
                    {hasCompletePricing ? formatCurrency(subtotal) : 'Calculated at checkout'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Shipping</dt>
                  <dd className="font-semibold text-gray-950">Calculated at checkout</dd>
                </div>
              </dl>
              <div className="mt-6 flex items-start gap-3 border-t border-gray-100 pt-5 text-sm text-gray-500">
                <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
                <p>Free local delivery in Bandung on orders over Rp 500.000.</p>
              </div>
              <Link
                href="/checkout"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-black px-6 text-sm font-semibold uppercase tracking-wide text-white no-underline transition-opacity hover:opacity-80"
              >
                <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                Proceed to checkout
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
