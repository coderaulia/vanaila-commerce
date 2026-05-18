'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { addToCart } from '@/features/commerce/cartStore';
import { removeFromWishlist, useWishlist } from '@/features/commerce/wishlistStore';

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function WishlistPageClient() {
  const [mounted, setMounted] = useState(false);
  const wishlist = useWishlist();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <h1 className="mt-4 text-3xl font-bold uppercase text-black">Wishlist</h1>
        </div>
        {wishlist.totalItems > 0 ? (
          <p className="text-sm font-medium text-gray-500">
            {wishlist.totalItems} {wishlist.totalItems === 1 ? 'item' : 'items'}
          </p>
        ) : null}
      </div>

      {wishlist.items.length === 0 ? (
        <section className="flex min-h-[44vh] flex-col items-center justify-center border border-gray-100 px-4 py-16 text-center">
          <Heart aria-hidden="true" className="h-16 w-16 text-gray-200" />
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Save products you want to revisit before checkout.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-12 items-center justify-center bg-black px-8 text-sm font-semibold uppercase tracking-wide text-white no-underline transition-opacity hover:opacity-80"
          >
            Browse the store
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Wishlist items">
          {wishlist.items.map((item) => {
            const product = item.product;
            const variant = product?.variants?.[0];
            const image = product?.images?.[0];
            const title = product?.title ?? 'Saved product';

            return (
              <article key={item.productId} className="border border-gray-100 p-4">
                <Link
                  href={product?.slug ? `/shop/${product.slug}` : '/shop'}
                  className="block aspect-[4/5] overflow-hidden bg-gray-100 no-underline"
                >
                  {image ? (
                    <img src={image} alt={title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag aria-hidden="true" className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </Link>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={product?.slug ? `/shop/${product.slug}` : '/shop'}
                      className="block truncate text-sm font-semibold text-gray-950 no-underline hover:text-gray-500"
                    >
                      {title}
                    </Link>
                    {variant ? (
                      <p className="mt-1 text-sm text-gray-500">{formatCurrency(variant.price)}</p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">Open product for pricing</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.productId)}
                    aria-label={`Remove ${title}`}
                    title="Remove item"
                    className="inline-flex h-10 w-10 items-center justify-center text-gray-400 transition-colors hover:text-red-600"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
                {product && variant ? (
                  <button
                    type="button"
                    onClick={() => addToCart(product, variant, 1)}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 bg-black px-4 text-xs font-semibold uppercase tracking-wide text-white transition-opacity hover:opacity-80"
                  >
                    <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                    Add to Cart
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
