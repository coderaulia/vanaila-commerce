'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Menu,
  Search,
  User,
  ShoppingBag,
  Heart,
  Star,
  X,
  Instagram,
  Facebook
} from 'lucide-react';

import type { LandingPage, SiteSettings } from '@/features/cms/types';
import styles from './javanesa.module.css';

type JavanesaHomeProps = {
  page: LandingPage;
  settings: SiteSettings;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center text-accent text-sm mb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          fill={i <= rating ? 'currentColor' : 'none'}
          strokeWidth={i <= rating ? 0 : 1.5}
          className="text-accent"
        />
      ))}
    </div>
  );
}

const DEMO_PRODUCTS = [
  {
    name: 'Javanese Lulur Scrub',
    price: '$35.00',
    compareAt: '$45.00',
    rating: 5,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-hw2wqUIYtpkKjoRzWmA6uKhx5M73kKf7q8IbANZiklBs7lHtIq3uD4GNGKe1LegZa0cPYuvvJYVeAzxVYTRnA-_8KVAOfmxT4qEStbDNvqEPg30yWuq8L3grzl7W0EsSIdE_eAsTx5Lt_BNmIKufGcEeGiHvXczB7gauO_tcG836wk4yeIxVN5XiJ8E6_Glvxaom57IZon7sj6sHu41VYMxpymGleYZyyfsEleoTctZfOaBCdmchN_IFc4DsTfv3dbUPs4HUbG4',
    alt: 'Javanese Lulur Scrub'
  },
  {
    name: 'Merapi Ash Cleanser',
    price: '$28.00',
    compareAt: null,
    rating: 4,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZaHyR5iYR_rrTUu0wJo_8xr2nq7KkLQV_3XvAR3tYIfexNTyPWErxzkX_gF5M8Ur5p-1VU5ANcmx2DnjtyVzeHJBVOPRX7qXaWqL0UWALx9WDFpFuy4t3GQlcv6UQMXOBMujk9_L50I6lWIRj8MrzLMKiHa0DKx8Xq236t96qFsxrqCKWjuptQyHiWK7B5rB1hh9K2vMt9-Ju2NhkmPmJP9OjanUQ1Y583nssohNcyuY7K3erbD_M4EvjaXTeVhIGV964gH7sAf0',
    alt: 'Merapi Ash Cleanser'
  },
  {
    name: 'Taman Sari Jasmine Mist',
    price: '$42.00',
    compareAt: null,
    rating: 4,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBilEgU3AoH4CSEBB08PpZ-GyxfL3nC0soLg58q_pQQpeO4RFyl6jH-EyFD8-PW26nd5LaKkl2Y2fqwcrmKc4_uqRoj1EUL6BsduW5iRhiUc0MKcr87FCPRXFaRek6EjAOAIqTT6rR9baUvNxqE1WdcBCr225Y7--_1eAjXuqGymPcJX8jpSsOcNEeofvdeHPpkz6k0UJeq_VElabUmXsjY-k28tC-1BgYS-Agk1EmhYZzWfJoejYMrT0yAb5uiJz4jf-hrbGnKKRg',
    alt: 'Taman Sari Jasmine Mist'
  },
  {
    name: 'Turmeric Brightening Elixir',
    price: '$55.00',
    compareAt: null,
    rating: 5,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqpMNNS3ukwDVQQnzahBl6gj13LIC6DNjL9OvBV1aN3weYTWSerqUTMl1_wvLCXWbhefwzVzabU4hRwyDp_BopvCfPsjroIjcTLgdAcJxHkhxPG_7R66kH4jF3hTB5HZC3aqZs2C6j61G89YoHhSvIcn7LMQ2tJy_6maDtFsSKoP2LjTCjztOXP_2Gm8sQfvvscod-vLdAqxlc3OKng5053Xub3zztuYLggwt9iDUuwT9O-HRpveqQ2yPiBAdAiZ6YU_niXMMjHzA',
    alt: 'Turmeric Brightening Elixir'
  }
];

const DEMO_CATEGORIES = [
  {
    name: 'Bio-Herbal',
    count: '12 Items',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxRkII8WpwZTz0Va9P2bKAgKrr181J2kl4u1WOrOKNIUebfdVcS4v8NsE0PnpTgXVG2NXiGpCbw-gmSt3QG17rwDVJ4kUBqMGAglTOdwnC2rt6HSkjefkQdlS1gVVRR4lHGcfBC8ezT4eMZeJ0_BJ4B1q52v1u2PpAa2fW8l_5eW_9oitmchWPVRPag6MWrPKIZCoO_UQfeo8KaOtQbeMlJBGhIkB6oevMliga0viC6JIMFjQO6mOor8_20Bj0IixIGaJD94TtNaA',
    offset: false,
    borderRadius: 'rounded-[40%_60%_70%_30%/40%_50%_60%_50%]',
    imgRadius: 'rounded-[35%_55%_65%_25%/35%_45%_55%_45%]',
    hoverRadius: 'group-hover:rounded-[50%_50%_40%_60%/60%_40%_50%_50%]'
  },
  {
    name: 'Body Lotion',
    count: '8 Items',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp5lraAaOpN3KxOnnSp88k8l_IapNK6Onb9ZWO4uFilIPOxg78s0Aua8KGUVlds5K_UIaTK01ujcDwoKa61sCIzhT1RqjzEwDSdy0uhXTCUmmgqmmEcDxuI0I_D9AO1PJp0GndoYTbmbon6Q94I-JNZrQpVL6osVsdMfhr1PWimRtTLwOibrTws8LCVJZRASTEzdiRuvG_sGUnLEwEUans-O1Di6gJDkw55Sm6MJM4lnDUQpr-ikrOqMnoyAINEw855TA_mujpIEw',
    offset: true,
    borderRadius: 'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]',
    imgRadius: 'rounded-[55%_35%_25%_65%/55%_25%_65%_35%]',
    hoverRadius: 'group-hover:rounded-[40%_60%_50%_50%/50%_50%_50%_50%]'
  },
  {
    name: 'Candle Spa',
    count: '5 Items',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6_lVTbg2umYf9JHYJ9iXyMWbBLnPdb_8dLxv94LgKrNXY77p2ku9xU00RTTWeiXjf0thQIuUR-rRrdDOrzxWx7zCyf40bpxnhCZhldGYDu5tD7oqXDR0IYgi7mpRTiA5B9drQFnKOE8zO4UuPhPdtUlEm9gWtLVbhZEblxjNaO5AVDtvVba_UIpSlBGS5EQTqMfjvwTkrYHxids5B4VtXdY7k3cBdspWtaGcGLCC6zLZLygK_OcIRmjZXbl5s_jn5gQruJbc5SD8',
    offset: false,
    borderRadius: 'rounded-[50%_50%_20%_80%/25%_80%_20%_75%]',
    imgRadius: 'rounded-[45%_45%_15%_75%/20%_75%_15%_70%]',
    hoverRadius: 'group-hover:rounded-[60%_40%_40%_60%/40%_60%_40%_60%]'
  },
  {
    name: 'Skin Care',
    count: '16 Items',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxNim3Bm4y1ZgGC4Z2xG4OmR3vh15lX2dZhaFrlaFcVJufFlVd15LAzTwKRAV118PPoDLlZH7AeTOGmOdH5bPayA7FFILvFimmH0x4hDldywuGC1BcJIqbpyawCd0gvTQnnaGv_6qXOiqREe0EtIPbuEDctumV7grzF7t2bF0swGrcXkXoJSTHvxB8-J4A9NSsAXQt8oapMXOCRER6-S0hDvJh-LHAKnhS06VTfQwJZhSOZI9rGbQK1jVgvcaoFZ5dVWazZoV2Hcs',
    offset: true,
    borderRadius: 'rounded-[30%_70%_70%_30%/30%_30%_70%_70%]',
    imgRadius: 'rounded-[25%_65%_65%_25%/25%_25%_65%_65%]',
    hoverRadius: 'group-hover:rounded-[50%_50%_50%_50%/50%_50%_50%_50%]'
  }
];

export function JavanesaHome({ page, settings }: JavanesaHomeProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hero = page.homeBlocks?.find((b) => b.enabled && b.type === 'hero');
  const heroTitle = 'titlePrimary' in (hero ?? {}) ? (hero as { titlePrimary?: string }).titlePrimary : null;
  const heroSubtitle = 'titleAccent' in (hero ?? {}) ? (hero as { titleAccent?: string }).titleAccent : null;
  const heroBody = 'body' in (hero ?? {}) ? (hero as { body?: string }).body : null;

  const siteName = settings.general.siteName || 'Javanesa.';
  const headerLogo = settings.branding.headerLogo;
  const footerLogo = settings.branding.footerLogo || headerLogo;
  const navLinks = settings.navigation.headerLinks.filter((l) => l.enabled);
  const footerNavLinks = settings.navigation.footerNavigatorLinks.filter((l) => l.enabled);
  const footerServiceLinks = settings.navigation.footerServiceLinks.filter((l) => l.enabled);
  const copyrightText = settings.branding.copyrightText || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const instagramHref = settings.social.instagramHref || '#';
  const shippingAnnouncement = 'Free shipping on all orders over $50 | Sourced from Yogyakarta, Java';

  return (
    <div className={`bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300 ${styles.root}`}>

      {/* Announcement bar */}
      <div className="bg-primary text-white text-center py-2 text-xs uppercase tracking-widest font-light">
        {shippingAnnouncement}
      </div>

      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center sm:hidden">
              <button
                className="text-text-light dark:text-text-dark hover:text-primary p-2"
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            <div className="flex-shrink-0 flex items-center justify-center sm:justify-start">
              <Link href="/">
                {headerLogo ? (
                  <Image src={headerLogo} alt={siteName} width={140} height={40} className="h-10 w-auto object-contain" />
                ) : (
                  <span className={`text-2xl font-bold italic tracking-wider text-primary ${styles.fontDisplay}`}>{siteName}</span>
                )}
              </Link>
            </div>

            <div className="hidden sm:flex space-x-8 items-center justify-center flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-sm uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/search" className="text-text-light dark:text-text-dark hover:text-primary transition-colors" aria-label="Search">
                <Search size={22} />
              </Link>
              <Link href="/admin" className="text-text-light dark:text-text-dark hover:text-primary transition-colors" aria-label="Account">
                <User size={22} />
              </Link>
              <Link href="/cart" className="text-text-light dark:text-text-dark hover:text-primary transition-colors relative" aria-label="Cart">
                <ShoppingBag size={22} />
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block text-sm uppercase tracking-widest hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative bg-surface-light dark:bg-surface-dark overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
            <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 z-10">
              <div className="max-w-xl text-center lg:text-left">
                <p className="text-accent text-sm uppercase tracking-[0.2em] mb-4 font-semibold">
                  Javanese Beauty Rituals
                </p>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-text-light dark:text-text-dark">
                  {heroTitle ?? 'Ancient Wisdom,'}{' '}
                  <br />
                  <span className="italic font-light text-primary">
                    {heroSubtitle ?? 'Modern Glow'}
                  </span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed font-light">
                  {heroBody ?? 'Discover skincare rooted in royal traditions of Yogyakarta. 100% natural, ethically sourced ingredients from the volcanic rich soils of Mount Merapi.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/shop"
                    className="inline-block bg-primary hover:bg-opacity-90 text-white px-8 py-4 text-sm uppercase tracking-widest transition-all text-center"
                  >
                    Shop Collection
                  </Link>
                  <Link
                    href="/about"
                    className="inline-block border border-text-light dark:border-text-dark hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary px-8 py-4 text-sm uppercase tracking-widest transition-all text-center"
                  >
                    Our Story
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative h-96 lg:h-auto z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Organic skincare products on volcanic stones"
                className="absolute inset-0 w-full h-full object-cover rounded-tl-[100px] rounded-bl-sm lg:rounded-bl-[150px] shadow-2xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4bSSzLB2DuT697QffmOCGHmCvv3IFJrsCXAJJ353ZaZDaGNolzZnWUYsKna3y3FdQyvMj17oUhwh2xEYDExBF3gdNGEHStJSMWebMI7R-HTjcqmg3pAhR3HCa0QL-V_ObsCcL1xzzD_bGurQhJjGQ621MWNEnxaxHem7QKusBwspj0K2tGC2_20e7iKHTVkG_WydyJKD83Yj5lTtSHP0cspUez9Mc62SolVPElFlqx-IiCTSEuYb8Cus2AxXczlCGYiFjVI-7xpU"
              />
              <div className="absolute top-8 right-8 bg-white dark:bg-background-dark rounded-full p-4 shadow-lg flex flex-col items-center justify-center w-24 h-24 rotate-12">
                <span className="text-[10px] uppercase tracking-wider text-center font-bold text-primary">100%</span>
                <span className="text-[10px] uppercase tracking-wider text-center text-gray-500">Natural</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured in */}
      <section className="py-12 border-b border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-8">As Featured In</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <span className={`italic text-xl font-bold ${styles.fontDisplay}`}>Vogue</span>
            <span className={`text-xl uppercase tracking-widest ${styles.fontDisplay}`}>Elle</span>
            <span className={`italic text-xl ${styles.fontDisplay}`}>Harper&apos;s Bazaar</span>
            <span className={`text-xl uppercase tracking-widest font-light ${styles.fontDisplay}`}>Kinfolk</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-accent text-xs uppercase tracking-[0.2em] font-semibold mb-2 block">Shop by category</span>
            <h2 className="text-4xl font-bold italic">Popular Categories</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {DEMO_CATEGORIES.map((cat) => (
              <Link key={cat.name} href="/shop" className={`group flex flex-col items-center text-center ${cat.offset ? 'mt-0 md:mt-12' : ''}`}>
                <div
                  className={`relative w-40 h-56 md:w-48 md:h-64 mb-6 overflow-hidden ${cat.borderRadius} transition-all duration-700 ${cat.hoverRadius} border-4 border-surface-light dark:border-surface-dark group-hover:border-primary/20 p-2`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={cat.name}
                    className={`w-full h-full object-cover ${cat.imgRadius} transition-transform duration-700 group-hover:scale-110`}
                    src={cat.img}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature split */}
      <section className="bg-surface-light dark:bg-surface-dark">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 h-96 lg:h-auto min-h-[500px] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Woman applying skincare cream"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKyDAXaRkYgwE8G4tesAYd3gvYmX3QV3wJs1Yv0wmeIMcxNkO-H8FqKjaRFxnnyXtFS6SZk1geoVowpdAUqV9sL340FzEZThz35RRz3nxLsx-LMqoqUMKGy0CYdN2EvH8yOeSEbZc_iv0jWcWX96EKOHzQ-g1NaXWtQj8oluqFoBCli9qOH6buHB8jJWa0EaOmHup9bMUv-gsBPOZAgKvskOrvwdtoDU-a19hl94cmo0kORmShlx_HmpIVsmFQER-e2E20XQCc3WY"
            />
          </div>
          <div className="w-full lg:w-1/2 flex items-center justify-center p-12 lg:p-24 relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none">
              <span className="text-[200px] italic font-bold block leading-none">Herbal</span>
            </div>
            <div className="max-w-md relative z-10 text-center lg:text-left">
              <p className="text-accent text-xs uppercase tracking-[0.2em] font-semibold mb-4">Best of Collection 2023</p>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Discover a Best of the Best <br />
                <span className="italic font-light">world of Herbal</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 font-light leading-relaxed">
                Our company announced a new tagline and manifesto, to enforce our dedication to fostering belonging among all clients through ancient Javanese remedies.
              </p>
              <Link
                href="/about"
                className="inline-block bg-text-light dark:bg-text-dark text-white dark:text-background-dark px-8 py-4 text-sm uppercase tracking-widest hover:bg-primary dark:hover:bg-primary hover:text-white transition-colors"
              >
                Read More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending products */}
      <section className="py-24 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-accent text-xs uppercase tracking-[0.2em] font-semibold mb-4">Trending Products</p>
            <h2 className="text-3xl md:text-4xl font-bold italic leading-tight">
              Having a place set aside for an activity you love makes it more likely you&apos;ll do it.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {DEMO_PRODUCTS.map((product) => (
              <div key={product.name} className="group">
                <div className="relative bg-surface-light dark:bg-surface-dark p-8 mb-4 rounded-lg flex justify-center items-center h-80 overflow-hidden">
                  <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10" type="button" aria-label="Add to wishlist">
                    <Heart size={20} />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={product.alt}
                    className="max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    src={product.img}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button className="w-full bg-primary text-white py-3 text-sm uppercase tracking-widest hover:bg-opacity-90 transition-colors" type="button">
                      Add to Cart
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <StarRating rating={product.rating} />
                  <h3 className="text-lg mb-1">{product.name}</h3>
                  <p className="text-sm font-semibold">
                    {product.price}
                    {product.compareAt && (
                      <span className="text-gray-400 line-through font-light ml-2">{product.compareAt}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/shop"
              className="inline-block border-b-2 border-primary text-primary font-semibold uppercase tracking-widest pb-1 hover:text-text-light dark:hover:text-text-dark hover:border-text-light dark:hover:border-text-dark transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-light dark:bg-surface-dark pt-20 pb-10 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <Link href="/" className="mb-6 block">
                {footerLogo ? (
                  <Image src={footerLogo} alt={siteName} width={140} height={40} className="h-10 w-auto object-contain" />
                ) : (
                  <span className={`text-3xl font-bold italic tracking-wider text-primary ${styles.fontDisplay}`}>{siteName}</span>
                )}
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {settings.branding.footerTagline || ''}
              </p>
              <div className="flex space-x-4">
                {instagramHref && instagramHref !== '#' && (
                  <a href={instagramHref} className="text-gray-400 hover:text-primary transition-colors" aria-label="Instagram">
                    <Instagram size={24} />
                  </a>
                )}
                {settings.social.websiteHref && (
                  <a href={settings.social.websiteHref} className="text-gray-400 hover:text-primary transition-colors" aria-label="Website">
                    <Facebook size={24} />
                  </a>
                )}
              </div>
            </div>

            {footerNavLinks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-6">Navigation</h4>
                <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  {footerNavLinks.map((link) => (
                    <li key={link.id}>
                      <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {footerServiceLinks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-6">Services</h4>
                <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  {footerServiceLinks.map((link) => (
                    <li key={link.id}>
                      <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold mb-6">Join Our Ritual</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Subscribe to receive 10% off your first order and insights into Javanese beauty.
              </p>
              <form className="flex flex-col space-y-3" onSubmit={(e) => e.preventDefault()}>
                <input
                  className="bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-primary dark:focus:border-primary focus:ring-0 px-0 py-2 text-sm w-full transition-colors outline-none"
                  placeholder="Email address"
                  type="email"
                />
                <button className="text-left text-sm uppercase tracking-widest font-semibold text-primary hover:text-text-light dark:hover:text-text-dark transition-colors mt-2" type="submit">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <p>{copyrightText}</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
