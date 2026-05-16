'use client';

import Link from 'next/link';
import { useState } from 'react';

import { addToCart } from '@/features/commerce/cartStore';
import type { Product, ProductVariant } from '@/features/commerce/types';
import { sanitizeProductDescriptionHtml } from './productDetailHtml';

type Props = {
  product: Product;
  relatedProducts?: Product[];
};

type ProductReview = {
  id: string;
  author: string;
  rating: number | null;
  title: string;
  body: string;
};

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function getProductPrice(product: Product): number | null {
  return product.variants?.find((variant) => variant.price > 0)?.price ?? product.variants?.[0]?.price ?? null;
}

function getProductReviews(product: Product): ProductReview[] {
  const source = (product as Product & { reviews?: unknown }).reviews;
  if (!Array.isArray(source)) return [];

  return source.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const review = item as Record<string, unknown>;
    const body = String(review.body ?? review.content ?? review.comment ?? '').trim();
    if (!body) return [];
    const ratingValue = Number(review.rating);
    return [{
      id: String(review.id ?? index),
      author: String(review.author ?? review.name ?? 'Verified buyer').trim() || 'Verified buyer',
      rating: Number.isFinite(ratingValue) ? Math.max(1, Math.min(5, ratingValue)) : null,
      title: String(review.title ?? '').trim(),
      body
    }];
  });
}

function ProductDescription({ html }: { html: string }) {
  const safeHtml = sanitizeProductDescriptionHtml(html);
  if (!safeHtml) return null;

  return (
    <div
      className="product-rich-text text-sm text-gray-600 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

function RelatedProductCard({ product }: { product: Product }) {
  const price = getProductPrice(product);
  const image = product.images[0];

  return (
    <Link href={`/shop/${product.slug}`} className="group block no-underline text-inherit">
      <div className="aspect-[4/5] overflow-hidden bg-[#f3f3f0]">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-gray-400">
            No image
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-black transition-colors group-hover:text-gray-600">
            {product.title}
          </h3>
          {product.shortDescription ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{product.shortDescription}</p>
          ) : null}
        </div>
        {price != null ? <p className="shrink-0 text-sm font-semibold text-black">{formatRupiah(price)}</p> : null}
      </div>
    </Link>
  );
}

export function ProductDetail({ product, relatedProducts = [] }: Props) {
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(variants[0] || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(product, selectedVariant, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const hasCompare =
    selectedVariant?.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : false;
  const optionKeys = variants[0]?.options ? Object.keys(variants[0].options) : [];
  const reviews = getProductReviews(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
        <Link href="/" className="hover:text-black transition-colors no-underline">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-black transition-colors no-underline">Shop</Link>
        <span>/</span>
        <span className="text-gray-700">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">

        {/* Images */}
        <div className="flex gap-4">
          {product.images.length > 1 && (
            <div className="flex flex-col gap-3 w-16 shrink-0">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square overflow-hidden rounded-sm border-2 transition-colors ${
                    selectedImage === i ? 'border-black' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`${product.title} view ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 aspect-[4/5] bg-gray-100 rounded-sm overflow-hidden">
            {product.images.length > 0 ? (
              <img
                src={product.images[selectedImage] ?? product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No image yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1
            className="font-bold text-3xl md:text-4xl uppercase leading-tight mb-3"
            style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
          >
            {product.title}
          </h1>

          {selectedVariant && (
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-2xl font-semibold ${hasCompare ? 'text-red-600' : ''}`}>
                {formatRupiah(selectedVariant.price)}
              </span>
              {hasCompare && (
                <span className="text-base text-gray-400 line-through">
                  {formatRupiah(selectedVariant.compareAtPrice!)}
                </span>
              )}
              {hasCompare && (
                <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-sm">SALE</span>
              )}
            </div>
          )}

          {product.shortDescription && (
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{product.shortDescription}</p>
          )}

          <div className="border-t border-gray-100 pt-6 space-y-5">
            {/* Variant selectors */}
            {optionKeys.map((key) => {
              const uniqueValues = [
                ...new Set(variants.map((v) => v.options?.[key]).filter(Boolean))
              ] as string[];

              return (
                <div key={key}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">
                    {key}:{' '}
                    <span className="text-black font-semibold normal-case tracking-normal">
                      {selectedVariant?.options?.[key] ?? ''}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueValues.map((val) => {
                      const isActive = selectedVariant?.options?.[key] === val;
                      const matchingVariant = variants.find((v) =>
                        Object.entries({ ...selectedVariant?.options, [key]: val }).every(
                          ([k, sv]) => v.options?.[k] === sv
                        )
                      ) ?? variants.find((v) => v.options?.[key] === val);
                      const isOutOfStock = !matchingVariant || matchingVariant.stock === 0;

                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            const target =
                              variants.find((v) =>
                                Object.entries({ ...selectedVariant?.options, [key]: val }).every(
                                  ([k, sv]) => v.options?.[k] === sv
                                )
                              ) ?? variants.find((v) => v.options?.[key] === val);
                            if (target) setSelectedVariant(target);
                          }}
                          className={`px-4 py-2 text-sm font-medium border transition-all rounded-sm ${
                            isActive
                              ? 'bg-black text-white border-black'
                              : isOutOfStock
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                                : 'border-gray-300 text-gray-700 hover:border-black'
                          }`}
                          style={{
                            backgroundColor: isActive ? '#0a0a0a' : '#ffffff',
                            borderColor: isActive ? '#0a0a0a' : isOutOfStock ? '#e5e7eb' : '#d1d5db',
                            color: isActive ? '#ffffff' : isOutOfStock ? '#d1d5db' : '#111827',
                            borderRadius: 4,
                            padding: '0.5rem 1rem'
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Qty + Add to Cart */}
            {inStock ? (
              <div className="flex gap-3 pt-2">
                <div className="flex items-center border border-gray-300 rounded-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="w-10 h-12 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
                    style={{ backgroundColor: '#ffffff', color: '#111827', borderRadius: 0, padding: 0 }}
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(selectedVariant!.stock, quantity + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-12 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
                    style={{ backgroundColor: '#ffffff', color: '#111827', borderRadius: 0, padding: 0 }}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 bg-black text-white font-semibold text-sm tracking-wide rounded-sm transition-opacity ${added ? 'atc-btn-added' : 'hover:opacity-80'}`}
                  style={{ backgroundColor: added ? '#15803d' : '#0a0a0a', color: '#ffffff', borderRadius: 4, padding: 0 }}
                >
                  <span className="atc-label">
                    {added ? '✓ ADDED TO CART' : 'ADD TO CART'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full h-12 bg-gray-200 text-gray-400 font-semibold text-sm tracking-wide rounded-sm cursor-not-allowed"
                  style={{ backgroundColor: '#e5e7eb', color: '#9ca3af', borderRadius: 4, padding: 0 }}
                >
                  OUT OF STOCK
                </button>
              </div>
            )}

            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
              <p className="text-xs text-red-600 font-medium">
                Only {selectedVariant.stock} left in stock
              </p>
            )}

            {/* Shipping info */}
            <div className="border border-gray-100 rounded-sm p-4 space-y-2 text-sm text-gray-500">
              {[
                'Free local delivery in Bandung on orders over Rp 500.000',
                'Ships nationwide via JNE / J&T within 1–3 business days',
                '7-day returns on unworn items with original tags'
              ].map((note) => (
                <div key={note} className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="font-bold text-sm uppercase tracking-widest mb-4">Product Details</h2>
              <ProductDescription html={product.description} />
            </div>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-20 border-t border-gray-100 pt-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">Customer Notes</p>
              <h2 className="mt-2 text-2xl font-bold uppercase text-black">Review</h2>
            </div>
            <p className="text-sm text-gray-500">{reviews.length} available</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.id} className="border border-gray-200 bg-white p-5">
                {review.rating != null ? (
                  <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-black">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </p>
                ) : null}
                {review.title ? <h3 className="mb-2 text-sm font-bold uppercase text-black">{review.title}</h3> : null}
                <p className="text-sm leading-relaxed text-gray-600">{review.body}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">{review.author}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-gray-100 pt-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-400">You may also like</p>
              <h2 className="mt-2 text-2xl font-bold uppercase text-black">Related Item</h2>
            </div>
            <Link href="/shop" className="text-xs font-bold uppercase tracking-widest text-black no-underline hover:text-gray-500">
              View shop
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((item) => (
              <RelatedProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
