'use client';

import Link from 'next/link';
import { useState } from 'react';

import { addToCart } from '@/features/commerce/cartStore';
import type { Product, ProductVariant } from '@/features/commerce/types';

type Props = {
  product: Product;
};

export function ProductDetail({ product }: Props) {
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
                Rp {selectedVariant.price.toLocaleString('id-ID')}
              </span>
              {hasCompare && (
                <span className="text-base text-gray-400 line-through">
                  Rp {selectedVariant.compareAtPrice!.toLocaleString('id-ID')}
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
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(selectedVariant!.stock, quantity + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-12 flex items-center justify-center text-lg hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 bg-black text-white font-semibold text-sm tracking-wide rounded-sm transition-opacity ${added ? 'atc-btn-added' : 'hover:opacity-80'}`}
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
              <p className="whitespace-pre-line text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
