'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { siteProfile } from '@/config/site-profile';
import { useCart } from '@/features/commerce/cartStore';

import './store.css';

type Props = {
  children: ReactNode;
};

function StoreHeader() {
  const { totalItems } = useCart();
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="store-header">
      <div className="store-header-inner">
        {/* Brand */}
        <Link href="/" className="store-brand no-underline">
          <span className="store-brand-wordmark">
            {siteProfile.brand.wordmark.replace('.', '').toLowerCase()}
          </span>
          <span className="store-brand-dot">●</span>
        </Link>

        {/* Nav */}
        <nav className="store-nav" aria-label="Store navigation">
          <Link
            href="/shop"
            className={`store-nav-link no-underline${isActive('/shop') ? ' active' : ''}`}
          >
            Shop
          </Link>
        </nav>

        {/* Cart icon */}
        <Link href="/cart" className="store-cart-btn no-underline" aria-label={`Cart, ${totalItems} item${totalItems !== 1 ? 's' : ''}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          {totalItems > 0 && (
            <span className="store-cart-badge" aria-hidden="true">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="store-footer-inner">
        <span className="store-footer-brand">
          {siteProfile.brand.wordmark.replace('.', '').toLowerCase()}
          <span className="store-brand-dot">●</span>
        </span>
        <nav className="store-footer-links" aria-label="Store footer navigation">
          <Link href="/shop" className="store-footer-link no-underline">Shop</Link>
          <Link href="/cart" className="store-footer-link no-underline">Cart</Link>
          <Link href="/contact" className="store-footer-link no-underline">Contact</Link>
          <Link href="/" className="store-footer-link no-underline">Back to site</Link>
        </nav>
        <p className="store-footer-copy">
          © {new Date().getFullYear()} {siteProfile.brand.wordmark}
        </p>
      </div>
    </footer>
  );
}

export function StoreShell({ children }: Props) {
  return (
    <div className="store-shell">
      <StoreHeader />
      <div className="store-content">{children}</div>
      <StoreFooter />
    </div>
  );
}
