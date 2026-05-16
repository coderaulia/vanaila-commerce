'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { modules } from '@/config/modules';
import { useCart, updateCartQuantity, removeFromCart } from '@/features/commerce/cartStore';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const cart = useCart();

  useEffect(() => { setMounted(true); }, []);

  if (!modules.ENABLE_STORE_MODULE) return null;
  if (!mounted) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1
        className="font-bold text-3xl uppercase tracking-tight mb-10"
        style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
      >
        Shopping Cart
      </h1>

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="text-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={0.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800">Your cart is empty</p>
            <p className="text-sm text-gray-400">Add something you love and it will show up here.</p>
          </div>
          <Link
            href="/shop"
            className="mt-2 inline-flex items-center gap-2 bg-black text-white text-sm font-semibold tracking-wide px-8 py-3 rounded-sm hover:opacity-80 transition-opacity no-underline"
          >
            Browse the Store
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.variantId}
                className="flex items-center gap-4 border border-gray-100 rounded-sm p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {item.product?.title || 'Product'}
                  </p>
                  {item.variant?.name && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}</p>
                  )}
                  {item.variant && (
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      Rp {item.variant.price.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div className="flex items-center border border-gray-200 rounded-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 flex items-center justify-center text-base hover:bg-gray-50 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                    aria-label="Increase quantity"
                    className="w-8 h-8 flex items-center justify-center text-base hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.variantId)}
                  aria-label="Remove item"
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="border border-gray-100 rounded-sm p-6 space-y-4 sticky top-24">
              <p className="text-sm text-gray-500">{cart.totalItems} item(s)</p>
              <Link
                href="/checkout"
                className="flex items-center justify-center w-full h-12 bg-black text-white font-semibold text-sm tracking-wide rounded-sm hover:opacity-80 transition-opacity no-underline"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/shop"
                className="flex items-center justify-center w-full h-10 border border-gray-200 text-gray-600 font-medium text-sm rounded-sm hover:border-gray-400 transition-colors no-underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
