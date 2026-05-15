'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { Product, ProductCategory } from '@/features/commerce/types';

type ProductListPayload = {
  products: Product[];
  meta: { total: number; page: number; pageSize: number };
};

export function ShopGrid() {
  const [data, setData] = useState<ProductListPayload | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

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

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0;

  return (
    <div className="shop-container">
      <div className="shop-filters">
        <input
          type="search"
          placeholder="Search products..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="shop-search"
          aria-label="Search products"
        />
        {categories.length > 0 && (
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="shop-category-filter"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="shop-loading">Loading products...</p>
      ) : !data?.products.length ? (
        <p className="shop-empty">No products found.</p>
      ) : (
        <>
          <div className="shop-grid">
            {data.products.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`} className="shop-card">
                {product.images[0] && (
                  <div className="shop-card-image">
                    <img src={product.images[0]} alt={product.title} loading="lazy" />
                  </div>
                )}
                <div className="shop-card-body">
                  <h3 className="shop-card-title">{product.title}</h3>
                  {product.shortDescription && (
                    <p className="shop-card-desc">{product.shortDescription}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="shop-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
