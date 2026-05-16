'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import type { Product, ProductVariant } from '@/features/commerce/types';
import { addToCart } from '@/features/commerce/cartStore';

type ProductListPayload = {
  products: Product[];
  meta: { total: number; page: number; pageSize: number };
};

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

function firstVariant(product: Product): ProductVariant | undefined {
  return product.variants?.[0];
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [data, setData] = useState<ProductListPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const current = searchParams.get('q') ?? '';
    setQ(current);
    if (!current.trim()) { setData(null); return; }

    setLoading(true);
    const params = new URLSearchParams({ q: current.trim(), pageSize: '24' });
    fetch(`/api/store/products?${params}`)
      .then(r => r.ok ? r.json() as Promise<ProductListPayload> : null)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/search');
    }
  }

  return (
    <div className="min-h-[60vh] px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <form onSubmit={handleSearch} className="mb-10">
          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-transparent px-5 py-3 focus-within:border-primary transition-colors">
            <Search size={20} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              className="flex-1 bg-transparent text-base outline-none"
              placeholder="Search products…"
            />
            {q.trim() && (
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-white"
              >
                Search
              </button>
            )}
          </label>
        </form>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {data.meta.total === 0
                ? `No results for "${searchParams.get('q')}"`
                : `${data.meta.total} result${data.meta.total !== 1 ? 's' : ''} for "${searchParams.get('q')}"`}
            </p>

            {data.products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                <p className="text-gray-500">Try a different search term.</p>
                <Link href="/shop" className="mt-3 inline-block text-sm text-primary hover:underline">
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.products.map(product => {
                  const variant = firstVariant(product);
                  return (
                    <Link
                      key={product.id}
                      href={`/shop/${product.slug}`}
                      className="group block rounded-2xl border border-gray-100 bg-white overflow-hidden text-inherit no-underline shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-widest text-gray-300">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm leading-snug">{product.title}</h3>
                        {product.shortDescription && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{product.shortDescription}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          {variant && <span className="text-sm font-semibold">{rupiah(variant.price)}</span>}
                          <button
                            type="button"
                            disabled={!variant}
                            onClick={e => {
                              e.preventDefault();
                              if (variant) addToCart(product, variant, 1);
                            }}
                            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!loading && !data && q === '' && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Type something to search products.
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
