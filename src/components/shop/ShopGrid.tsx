'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import '@/components/shop/store.css';

import type { Product, ProductCategory } from '@/features/commerce/types';
import { toggleWishlistProduct, useWishlist } from '@/features/commerce/wishlistStore';

type ProductListPayload = {
  products: Product[];
  meta: { total: number; page: number; pageSize: number };
};

type ShopGridProps = {
  initialCategoryId?: string;
};

export function ShopGrid({ initialCategoryId = '' }: ShopGridProps) {
  const [data, setData] = useState<ProductListPayload | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const wishlist = useWishlist();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (categoryId) params.set('categoryId', categoryId);
    if (q) params.set('q', q);
    const res = await fetch(`/api/store/products?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [categoryId, q, page]);

  useEffect(() => {
    fetch('/api/store/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  return (
    <section className="py-20 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <input
            type="search"
            placeholder="Search products..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Search products"
            className="flex-1 border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black rounded-sm"
          />
          {categories.length > 0 && (
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              className="border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black rounded-sm bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-sm mb-3" />
                <div className="h-4 bg-gray-100 animate-pulse rounded mb-2 w-2/3" />
                <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : !data?.products.length ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No products found.</p>
            <p className="text-sm mt-2">Try a different search or category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.products.map((product) => {
                const variant = product.variants?.[0];
                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    className="group no-underline text-black"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm mb-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gray-200" />
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          toggleWishlistProduct(product);
                        }}
                        aria-label={wishlist.productIds.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        aria-pressed={wishlist.productIds.has(product.id)}
                        className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${
                          wishlist.productIds.has(product.id)
                            ? 'border-black bg-black text-white hover:bg-gray-800'
                            : 'border-white bg-white/90 text-black hover:bg-white'
                        }`}
                      >
                        <Heart aria-hidden="true" className={`h-4 w-4 ${wishlist.productIds.has(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{product.title}</h3>
                    {product.shortDescription && (
                      <p className="text-gray-400 text-xs mb-1 line-clamp-1">
                        {product.shortDescription}
                      </p>
                    )}
                    {variant && (
                      <div className="flex items-center gap-2 text-sm">
                        {variant.compareAtPrice && variant.compareAtPrice > variant.price ? (
                          <>
                            <span className="text-red-600 font-medium">
                              Rp {variant.price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-gray-400 line-through text-xs">
                              Rp {variant.compareAtPrice.toLocaleString('id-ID')}
                            </span>
                          </>
                        ) : (
                          <span>Rp {variant.price.toLocaleString('id-ID')}</span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-5 py-2 border border-gray-300 text-sm font-medium hover:border-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-5 py-2 border border-gray-300 text-sm font-medium hover:border-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
