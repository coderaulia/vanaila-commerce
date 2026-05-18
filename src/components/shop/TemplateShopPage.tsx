'use client';

import Link from 'next/link';
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';

import { addToCart } from '@/features/commerce/cartStore';
import { toggleWishlistProduct, useWishlist } from '@/features/commerce/wishlistStore';
import type { HeroBlock, LandingPage } from '@/features/cms/types';
import type { Product, ProductCategory, ProductVariant } from '@/features/commerce/types';

import javanesaStyles from '@/components/home/templates/javanesa/javanesa.module.css';
import voltaStyles from '@/components/home/templates/volta/volta.module.css';

type TemplateId = 'volta' | 'javanesa';

type ProductListPayload = {
  products: Product[];
  meta: { total: number; page: number; pageSize: number };
};

type TemplateShopPageProps = {
  template: TemplateId;
  page?: LandingPage | null;
  initialCategory?: string;
  categoryCopy?: {
    eyebrow: string;
    title: string;
    description: string;
  };
};

const rupiah = (price: number) => `Rp ${price.toLocaleString('id-ID')}`;

function getStorefrontCopy(page?: LandingPage | null, override?: TemplateShopPageProps['categoryCopy']) {
  if (override) return override;

  const hero = page?.homeBlocks?.find((block): block is HeroBlock => block.enabled && block.type === 'hero');

  return {
    eyebrow: hero?.badge?.trim(),
    title: [hero?.titlePrimary, hero?.titleAccent].filter(Boolean).join(' ').trim(),
    description: hero?.description?.trim(),
  };
}

function firstVariant(product: Product): ProductVariant | undefined {
  return product.variants?.[0];
}

function useShopProducts(initialCategory = '') {
  const [data, setData] = useState<ProductListPayload | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get('categoryId') || params.get('category') || initialCategory);
    setFeaturedOnly(params.get('featured') === 'true');
    setQ(params.get('q') || '');
  }, [initialCategory]);

  useEffect(() => {
    fetch('/api/store/categories')
      .then((r) => r.json())
      .then((d: { categories?: ProductCategory[] }) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const resolvedCategoryId = useMemo(() => {
    if (!category) return '';
    return categories.find((cat) => cat.id === category || cat.slug === category)?.id || category;
  }, [categories, category]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (resolvedCategoryId) params.set('categoryId', resolvedCategoryId);
    if (featuredOnly) params.set('featured', 'true');
    if (q.trim()) params.set('q', q.trim());

    const res = await fetch(`/api/store/products?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [featuredOnly, page, q, resolvedCategoryId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const selectCategory = (next: string) => {
    setCategory(next);
    setPage(1);
  };

  const updateSearch = (next: string) => {
    setQ(next);
    setPage(1);
  };

  const toggleFeatured = () => {
    setFeaturedOnly((current) => !current);
    setPage(1);
  };

  return {
    data,
    categories,
    loading,
    category,
    q,
    featuredOnly,
    page,
    totalPages: data ? Math.ceil(data.meta.total / data.meta.pageSize) : 0,
    selectCategory,
    updateSearch,
    toggleFeatured,
    setPage,
  };
}

function AddButton({ product, variant, className }: { product: Product; variant?: ProductVariant; className: string }) {
  const [added, setAdded] = useState(false);

  const add = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!variant) return;
    addToCart(product, variant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <button type="button" className={className} disabled={!variant} onClick={add}>
      <ShoppingBag size={16} aria-hidden="true" />
      <span>{added ? 'Added' : 'Add'}</span>
    </button>
  );
}

function WishlistButton({ product, className }: { product: Product; className: string }) {
  const wishlist = useWishlist();
  const active = wishlist.productIds.has(product.id);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleWishlistProduct(product);
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      onClick={toggle}
    >
      <Heart size={18} aria-hidden="true" className={active ? 'fill-current' : ''} />
    </button>
  );
}

function EmptyState({ template }: { template: TemplateId }) {
  return (
    <div className={template === 'volta' ? 'rounded-[28px] bg-[#F4F2EE] px-6 py-20 text-center' : 'rounded-[48px] bg-[#f7efe5] px-6 py-20 text-center'}>
      <p className="text-lg font-semibold">No products found.</p>
      <p className="mt-2 text-sm opacity-60">Try a different search or collection.</p>
    </div>
  );
}

function Pager({ page, totalPages, setPage, template }: {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  template: TemplateId;
}) {
  if (totalPages <= 1) return null;
  const btn = template === 'volta'
    ? 'h-11 rounded-full border border-black/10 px-5 text-sm font-semibold transition hover:border-[#2A5BD7] disabled:opacity-40'
    : 'h-11 rounded-full border border-[#8b5e34]/25 px-5 text-xs font-bold uppercase tracking-[0.18em] text-[#7b4d27] transition hover:border-[#9f6b38] disabled:opacity-40';

  return (
    <div className="mt-14 flex items-center justify-center gap-4">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span className="text-sm opacity-60">{page} / {totalPages}</span>
      <button type="button" className={btn} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}

function VoltaProductCard({ product }: { product: Product }) {
  const variant = firstVariant(product);

  return (
    <Link href={`/shop/${product.slug}`} className={`${voltaStyles.tile} group block overflow-hidden rounded-[28px] bg-white p-4 text-[#0A0A0A] no-underline shadow-[0_1px_0_rgba(10,10,10,0.06)]`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#F4F2EE]">
        {product.featured && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-[#2A5BD7] px-3 py-1 text-[11px] font-bold text-white">
            Featured
          </span>
        )}
        <WishlistButton
          product={product}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-sm transition hover:bg-white"
        />
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-black/25">Product</div>
        )}
      </div>
      <div className="grid min-h-[128px] grid-cols-[1fr_auto] gap-4 pt-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2A5BD7]">Volta Store</p>
          <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.02em]">{product.title}</h3>
          {product.shortDescription && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6B6B6B]">{product.shortDescription}</p>}
        </div>
        <div className="flex flex-col items-end justify-between gap-4">
          {variant && <span className="whitespace-nowrap text-sm font-semibold">{rupiah(variant.price)}</span>}
          <AddButton
            product={product}
            variant={variant}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0A0A0A] px-4 text-xs font-semibold text-white transition hover:bg-[#2A5BD7] disabled:opacity-40"
          />
        </div>
      </div>
    </Link>
  );
}

function JavanesaProductCard({ product, index }: { product: Product; index: number }) {
  const variant = firstVariant(product);
  const radii = [
    'rounded-[38%_62%_52%_48%/42%_45%_55%_58%]',
    'rounded-[58%_42%_44%_56%/48%_58%_42%_52%]',
    'rounded-[48%_52%_62%_38%/54%_38%_62%_46%]',
  ];

  return (
    <Link href={`/shop/${product.slug}`} className="group block text-center text-[#2d2118] no-underline">
      <div className={`relative mx-auto mb-5 aspect-[3/4] w-full overflow-hidden bg-[#f1e4d6] p-3 ${radii[index % radii.length]} transition-all duration-700 group-hover:rounded-[44%_56%_48%_52%/52%_44%_56%_48%]`}>
        <WishlistButton
          product={product}
          className="absolute right-5 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[#9f6b38] shadow-sm transition hover:bg-white"
        />
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.title} className="h-full w-full rounded-[inherit] object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center rounded-[inherit] text-[10px] uppercase tracking-[0.2em] text-[#9f6b38]/45">Ritual</div>
        )}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b77945]">{product.featured ? 'Best ritual' : 'Javanesa'}</p>
      <h3 className={`${javanesaStyles.fontDisplay} mt-2 text-2xl leading-tight text-[#2d2118]`}>{product.title}</h3>
      {product.shortDescription && <p className="mx-auto mt-2 line-clamp-2 max-w-xs text-sm leading-6 text-[#6c5b4d]">{product.shortDescription}</p>}
      <div className="mt-4 flex items-center justify-center gap-4">
        {variant && <span className="text-sm font-bold">{rupiah(variant.price)}</span>}
        <AddButton
          product={product}
          variant={variant}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#8b5e34] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#5f3b21] disabled:opacity-40"
        />
      </div>
    </Link>
  );
}

export function VoltaShopPage({
  page,
  initialCategory,
  categoryCopy,
}: {
  page?: LandingPage | null;
  initialCategory?: string;
  categoryCopy?: TemplateShopPageProps['categoryCopy'];
}) {
  const shop = useShopProducts(initialCategory);
  const copy = getStorefrontCopy(page, categoryCopy);
  const products = shop.data?.products ?? [];
  const featured = products.find((product) => product.featured) ?? products[0] ?? null;
  const featuredVariant = featured ? firstVariant(featured) : undefined;

  return (
    <div className={`${voltaStyles.root} bg-[#FAFAF9] text-[#0A0A0A]`}>
      <section className="relative overflow-hidden px-6 py-16 sm:px-10 lg:py-24">
        <div className={`${voltaStyles.blob} ${voltaStyles.blobA}`} />
        <div className={`${voltaStyles.blob} ${voltaStyles.blobB}`} />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <span className="inline-flex rounded-full bg-[#2A5BD7]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2A5BD7]">
              {copy.eyebrow || 'Store / Devices'}
            </span>
            <h1 className="mt-8 max-w-3xl text-6xl font-semibold leading-[0.96] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
              {copy.title || 'Built to compare. Easy to buy.'}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#6B6B6B]">
              {copy.description || 'Explore the full Volta lineup with clean specs, fast filters, and featured picks at the top.'}
            </p>
          </div>
          <div className="rounded-[32px] bg-[#F4F2EE] p-4 shadow-[0_20px_70px_rgba(10,10,10,0.08)]">
            {featured ? (
              <Link href={`/shop/${featured.slug}`} className="grid gap-5 text-[#0A0A0A] no-underline sm:grid-cols-[1fr_0.9fr]">
                <div className="aspect-[4/3] overflow-hidden rounded-[24px] bg-white">
                  {featured.images[0] ? (
                    <img src={featured.images[0]} alt={featured.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-black/25">Featured</div>
                  )}
                </div>
                <div className="flex flex-col justify-between p-2 sm:p-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2A5BD7]">Featured drop</p>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em]">{featured.title}</h2>
                    {featured.shortDescription && <p className="mt-3 text-sm leading-6 text-[#6B6B6B]">{featured.shortDescription}</p>}
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    {featuredVariant && <span className="font-semibold">{rupiah(featuredVariant.price)}</span>}
                    <AddButton
                      product={featured}
                      variant={featuredVariant}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2A5BD7] px-5 text-sm font-semibold text-white transition hover:bg-[#0A0A0A] disabled:opacity-40"
                    />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="aspect-[16/7] rounded-[24px] bg-white" />
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 sm:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 grid gap-4 rounded-[28px] bg-white p-3 shadow-[0_1px_0_rgba(10,10,10,0.06)] lg:grid-cols-[1fr_auto_auto]">
            <label className="flex h-12 items-center gap-3 rounded-full bg-[#F4F2EE] px-5 text-sm text-[#6B6B6B]">
              <Search size={18} aria-hidden="true" />
              <input value={shop.q} onChange={(event) => shop.updateSearch(event.target.value)} className="w-full bg-transparent text-[#0A0A0A] outline-none" placeholder="Search products" type="search" />
            </label>
            <select value={shop.category} onChange={(event) => shop.selectCategory(event.target.value)} className="h-12 rounded-full border border-black/10 bg-white px-5 text-sm outline-none">
              <option value="">All categories</option>
              {shop.categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <button type="button" onClick={shop.toggleFeatured} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${shop.featuredOnly ? 'bg-[#2A5BD7] text-white' : 'bg-[#F4F2EE] text-[#0A0A0A]'}`}>
              <SlidersHorizontal size={17} aria-hidden="true" />
              Featured
            </button>
          </div>

          {shop.loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[360px] animate-pulse rounded-[28px] bg-white" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState template="volta" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => <VoltaProductCard key={product.id} product={product} />)}
            </div>
          )}
          <Pager page={shop.page} totalPages={shop.totalPages} setPage={shop.setPage} template="volta" />
        </div>
      </section>
    </div>
  );
}

export function JavanesaShopPage({
  page,
  initialCategory,
  categoryCopy,
}: {
  page?: LandingPage | null;
  initialCategory?: string;
  categoryCopy?: TemplateShopPageProps['categoryCopy'];
}) {
  const shop = useShopProducts(initialCategory);
  const copy = getStorefrontCopy(page, categoryCopy);
  const products = shop.data?.products ?? [];

  return (
    <div className={`${javanesaStyles.root} bg-[#fbf7f1] text-[#2d2118]`}>
      <section className="relative overflow-hidden px-6 py-16 sm:px-10 lg:py-24">
        <div className="absolute left-[-90px] top-10 h-72 w-72 rounded-full bg-[#d8a15f]/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-80px] h-80 w-80 rounded-full bg-[#6f8f57]/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b77945]">{copy.eyebrow || 'Javanese ritual shop'}</p>
            <h1 className={`${javanesaStyles.fontDisplay} mt-5 text-6xl leading-[0.98] text-[#2d2118] sm:text-7xl`}>
              {copy.title || 'Botanical care, shaped by tradition.'}
            </h1>
            <p className="mt-6 max-w-lg text-lg font-light leading-8 text-[#6c5b4d]">
              {copy.description || 'Browse warm, natural collections with soft category paths and ritual-led product cards.'}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {products.slice(0, 2).map((product, index) => (
              <JavanesaProductCard key={product.id} product={product} index={index} />
            ))}
            {products.length === 0 && <div className="min-h-[420px] rounded-[44%_56%_48%_52%/52%_44%_56%_48%] bg-[#f1e4d6]" />}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 rounded-[48px] bg-[#fffaf4] p-5 shadow-[0_20px_80px_rgba(92,60,30,0.08)]">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <label className="flex h-14 items-center gap-3 rounded-full border border-[#8b5e34]/15 bg-white px-5 text-sm text-[#8b6f59]">
                <Search size={18} aria-hidden="true" />
                <input value={shop.q} onChange={(event) => shop.updateSearch(event.target.value)} className="w-full bg-transparent text-[#2d2118] outline-none" placeholder="Search your ritual" type="search" />
              </label>
              <button type="button" onClick={shop.toggleFeatured} className={`inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-[0.18em] transition ${shop.featuredOnly ? 'bg-[#8b5e34] text-white' : 'bg-[#f1e4d6] text-[#7b4d27]'}`}>
                <SlidersHorizontal size={17} aria-hidden="true" />
                Best rituals
              </button>
            </div>
            {shop.categories.length > 0 && (
              <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
                <button type="button" onClick={() => shop.selectCategory('')} className={`h-11 shrink-0 rounded-full px-5 text-xs font-bold uppercase tracking-[0.16em] transition ${shop.category === '' ? 'bg-[#2d2118] text-white' : 'bg-white text-[#7b4d27]'}`}>
                  All
                </button>
                {shop.categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => shop.selectCategory(cat.id)} className={`h-11 shrink-0 rounded-full px-5 text-xs font-bold uppercase tracking-[0.16em] transition ${shop.category === cat.id || shop.category === cat.slug ? 'bg-[#8b5e34] text-white' : 'bg-white text-[#7b4d27]'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {shop.loading ? (
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[460px] animate-pulse rounded-[44%_56%_48%_52%/52%_44%_56%_48%] bg-[#f1e4d6]" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState template="javanesa" />
          ) : (
            <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => <JavanesaProductCard key={product.id} product={product} index={index} />)}
            </div>
          )}
          <Pager page={shop.page} totalPages={shop.totalPages} setPage={shop.setPage} template="javanesa" />
        </div>
      </section>
    </div>
  );
}

export function TemplateShopPage({ template, page, initialCategory, categoryCopy }: TemplateShopPageProps) {
  if (template === 'javanesa') return <JavanesaShopPage page={page} initialCategory={initialCategory} categoryCopy={categoryCopy} />;
  return <VoltaShopPage page={page} initialCategory={initialCategory} categoryCopy={categoryCopy} />;
}
