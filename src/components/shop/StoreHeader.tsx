'use client';

import Link from 'next/link';
import { useState } from 'react';

import { siteProfile } from '@/config/site-profile';
import type { SiteSettings } from '@/features/cms/types';
import { useCart } from '@/features/commerce/cartStore';
import { useWishlist } from '@/features/commerce/wishlistStore';

type Props = {
  siteName: string;
  settings: SiteSettings;
};

const NAV_LINKS = [
  { href: '/shop', label: 'SHOP' },
  { href: '/shop?tag=new', label: 'NEW ARRIVALS' },
  { href: '/categories', label: 'CATEGORIES' },
  { href: '/about', label: 'ABOUT' },
];

export function StoreHeader({ siteName, settings }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const wishlist = useWishlist();
  const brandLogo = settings.branding.headerLogo || settings.organizationLogo;
  const brandName = siteName.endsWith('.') ? siteName.slice(0, -1) : siteName;
  const wordmark = siteProfile.brand.wordmark;

  return (
    <>
      {/* Announcement bar — scrolls away */}
      <div className="bg-black text-white text-xs font-medium py-2 text-center flex justify-center items-center gap-3">
        <span aria-hidden>‹</span>
        <span>FREE LOCAL DELIVERY IN BANDUNG ON ORDERS OVER RP 500.000</span>
        <span aria-hidden>›</span>
      </div>

      {/* Sticky nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-16">

            {/* Left — desktop nav */}
            <nav className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs font-bold tracking-widest text-black hover:text-gray-400 transition-colors no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger (left col on mobile) */}
            <button
              type="button"
              className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span className={`block w-5 h-0.5 bg-black transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-black transition-opacity duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-black transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>

            {/* Center — wordmark */}
            <div className="flex justify-center">
              <Link href="/shop" className="no-underline">
                {brandLogo ? (
                  <img src={brandLogo} alt={brandName} className="h-9 w-auto max-w-[160px] object-contain" />
                ) : (
                  <span
                    className="font-bold text-2xl uppercase text-black leading-none"
                    style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
                  >
                    {wordmark}
                  </span>
                )}
              </Link>
            </div>

            {/* Right — icons */}
            <div className="flex items-center justify-end gap-5">
              <button type="button" aria-label="Search" className="hidden md:flex text-black hover:text-gray-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
              </button>

              <Link href="/admin" className="hidden md:flex text-black hover:text-gray-400 transition-colors no-underline" aria-label="Account">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>

              <Link href="/wishlist" className="relative text-black hover:text-gray-400 transition-colors no-underline" aria-label={`Wishlist (${wishlist.totalItems} items)`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={wishlist.totalItems > 0 ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0 6.25-9 11.25-9 11.25S3 14.5 3 8.25A4.75 4.75 0 017.75 3.5c1.8 0 3.3 1 4.25 2.25A5.2 5.2 0 0116.25 3.5 4.75 4.75 0 0121 8.25z" />
                </svg>
                {wishlist.totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center leading-none">
                    {wishlist.totalItems > 9 ? '9+' : wishlist.totalItems}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="relative text-black hover:text-gray-400 transition-colors no-underline" aria-label={`Cart (${totalItems} items)`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-0 pt-20 z-40 bg-white flex flex-col items-center justify-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xl font-bold tracking-widest text-black no-underline"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/wishlist"
            className="text-xl font-bold tracking-widest text-black no-underline flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            WISHLIST {wishlist.totalItems > 0 && `(${wishlist.totalItems})`}
          </Link>
          <Link
            href="/cart"
            className="text-xl font-bold tracking-widest text-black no-underline flex items-center gap-2"
            onClick={() => setMobileOpen(false)}
          >
            CART {totalItems > 0 && `(${totalItems})`}
          </Link>
        </div>
      )}
    </>
  );
}
