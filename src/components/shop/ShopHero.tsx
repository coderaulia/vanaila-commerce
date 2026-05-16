'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { addToCart } from '@/features/commerce/cartStore';
import type { Product } from '@/features/commerce/types';

// ─── Hero Split ──────────────────────────────────────────────────────────────

function HeroSplit() {
  return (
    <section className="flex flex-col md:flex-row min-h-[80vh]">
      {/* Left — editorial */}
      <div className="w-full md:w-1/2 relative h-[50vh] md:h-auto bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20" />
        <div className="absolute bottom-10 left-10 text-white max-w-md">
          <h1
            className="font-bold text-5xl md:text-7xl uppercase leading-none mb-4"
            style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
          >
            Urban
            <br />
            Essentials
          </h1>
          <p className="text-lg md:text-xl font-medium mb-6 text-white/90">
            Born in Bandung. Worn everywhere.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/shop"
              className="bg-white text-black px-6 py-3 font-semibold text-sm tracking-wide hover:bg-gray-100 transition-colors no-underline"
            >
              SHOP MENS
            </Link>
            <Link
              href="/shop"
              className="bg-transparent border border-white text-white px-6 py-3 font-semibold text-sm tracking-wide hover:bg-white/10 transition-colors no-underline"
            >
              SHOP WOMENS
            </Link>
          </div>
        </div>
      </div>

      {/* Right — spotlight product */}
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col justify-center items-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <p className="uppercase tracking-widest text-xs font-bold text-gray-400 mb-4">
            Spotlight / New Arrival
          </p>
          <SpotlightProduct />
        </div>
      </div>
    </section>
  );
}

function SpotlightProduct() {
  const [product, setProduct] = useState<Product | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch('/api/store/products?pageSize=1&featured=true')
      .then((r) => r.json())
      .then((d) => setProduct(d.products?.[0] ?? null))
      .catch(() => {});
  }, []);

  const variant = product?.variants?.[0];

  const handleQuickAdd = () => {
    if (!product || !variant) return;
    addToCart(product, variant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) {
    return (
      <div className="animate-pulse">
        <div className="w-full aspect-[4/5] bg-gray-200 rounded-sm mb-8" />
        <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
        <div className="h-4 bg-gray-200 rounded mb-6 w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    );
  }

  return (
    <>
      <Link href={`/shop/${product.slug}`} className="block no-underline mb-8">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full aspect-[4/5] object-cover rounded-sm shadow-lg"
          />
        ) : (
          <div className="w-full aspect-[4/5] bg-gray-200 rounded-sm" />
        )}
      </Link>
      <h2
        className="font-bold text-3xl uppercase mb-2"
        style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.02em' }}
      >
        {product.title}
      </h2>
      {product.shortDescription && (
        <p className="text-gray-500 mb-6 text-sm">{product.shortDescription}</p>
      )}
      <div className="flex items-center justify-between">
        {variant && (
          <span className="text-xl font-semibold">
            Rp {variant.price.toLocaleString('id-ID')}
          </span>
        )}
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={!variant}
          className="bg-black text-white px-8 py-3 font-semibold text-sm tracking-wide hover:opacity-80 transition-opacity disabled:opacity-40 rounded-sm"
        >
          {added ? '✓ ADDED' : 'QUICK ADD'}
        </button>
      </div>
    </>
  );
}

// ─── Trending Carousel ───────────────────────────────────────────────────────

const BADGE_CLASSES: Record<string, string> = {
  Sale: 'bg-red-600 text-white',
  Popular: 'bg-yellow-400 text-black',
  New: 'bg-blue-600 text-white',
};

function TrendingSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/store/products?pageSize=8')
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-10">
        <h2
          className="font-bold text-4xl uppercase tracking-tight"
          style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
        >
          Trending Now
        </h2>
        <Link
          href="/shop"
          className="text-sm font-semibold uppercase tracking-wider flex items-center gap-1 hover:text-gray-400 transition-colors no-underline"
        >
          View All →
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-8 store-no-scrollbar snap-x snap-mandatory">
        {products.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-none w-72 sm:w-80 snap-start">
                <div className="aspect-[3/4] bg-gray-100 animate-pulse rounded-sm" />
                <div className="mt-3 h-4 bg-gray-100 animate-pulse rounded w-2/3" />
                <div className="mt-2 h-4 bg-gray-100 animate-pulse rounded w-1/3" />
              </div>
            ))
          : products.map((product) => (
              <TrendingCard
                key={product.id}
                product={product}
                variant={product.variants?.[0]}
                badge={product.featured ? 'Popular' : undefined}
              />
            ))}
      </div>
    </section>
  );
}

type Variant = NonNullable<Product['variants']>[number];

type TrendingCardProps = {
  product: Product;
  variant?: Variant;
  badge?: string;
};

function TrendingCard({ product, variant, badge }: TrendingCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!variant) return;
    addToCart(product, variant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link href={`/shop/${product.slug}`} className="flex-none w-72 sm:w-80 snap-start group no-underline text-black">
      <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100 rounded-sm">
        {badge && (
          <span
            className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 uppercase tracking-wider z-10 ${BADGE_CLASSES[badge] ?? 'bg-blue-600 text-white'}`}
          >
            {badge}
          </span>
        )}
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
          onClick={handleAdd}
          aria-label={`Quick add ${product.title}`}
          className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-100"
        >
          🛍
        </button>
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm">{product.title}</h3>
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
      </div>
      {added && (
        <p className="text-xs text-green-600 mt-1 font-medium">Added to cart</p>
      )}
    </Link>
  );
}

// ─── Brand Story ─────────────────────────────────────────────────────────────

function BrandStory() {
  return (
    <section className="bg-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2 p-8 lg:p-16 space-y-6">
          <p className="uppercase tracking-widest text-xs font-bold text-gray-400">
            Local Pride, Global Quality
          </p>
          <h2
            className="font-bold text-4xl lg:text-5xl uppercase leading-tight"
            style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
          >
            Crafted in the
            <br />
            Paris of Java
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-md">
            Our garments are designed and manufactured right here in Bandung. We source premium
            materials to create durable, stylish streetwear that represents our city&apos;s rich
            creative heritage.
          </p>
          <Link
            href="/about"
            className="inline-block bg-black text-white px-8 py-3 font-semibold text-sm tracking-wide hover:opacity-80 transition-opacity no-underline rounded-sm mt-4"
          >
            LEARN OUR STORY
          </Link>
        </div>
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto self-stretch relative min-h-[400px] bg-gray-300">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600" />
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    stars: 5,
    title: 'Best quality out there!',
    body: "I've bought several hoodies from different local brands, but the quality here is unmatched. The material is thick but breathable, perfect for Bandung weather.",
    author: 'Raka W.',
  },
  {
    stars: 5,
    title: 'Crazy fast shipping!',
    body: 'Ordered the new cargo pants yesterday morning and it arrived this afternoon! The fit is true to size and the stitching looks solid.',
    author: 'Sarah M.',
  },
  {
    stars: 4.5,
    title: 'Stylish and comfortable',
    body: "The graphic tees are fire. Love the subtle nod to Bandung culture in the designs. They wash well too — no shrinking or fading so far.",
    author: 'Kevin A.',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-yellow-400 mb-4" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill={i <= Math.floor(rating) ? 'currentColor' : i - 0.5 <= rating ? 'url(#half)' : 'none'}
          stroke="currentColor"
          strokeWidth={i <= Math.floor(rating) || i - 0.5 <= rating ? 0 : 1}
        >
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Testimonials() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <p className="uppercase tracking-widest text-xs font-bold text-gray-400 mb-3">
          TESTIMONIALS
        </p>
        <h2
          className="font-bold text-4xl uppercase tracking-tight"
          style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
        >
          WHAT OUR CUSTOMERS SAY
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {TESTIMONIALS.map((t) => (
          <div key={t.author} className="bg-gray-50 p-8 rounded-sm">
            <StarRating rating={t.stars} />
            <h3 className="font-bold text-lg mb-2">{t.title}</h3>
            <p className="text-gray-500 text-sm mb-6 line-clamp-4">{t.body}</p>
            <p className="font-semibold text-sm">— {t.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Composed export ─────────────────────────────────────────────────────────

export function ShopHero() {
  return (
    <>
      <HeroSplit />
      <TrendingSection />
      <BrandStory />
      <Testimonials />
    </>
  );
}
