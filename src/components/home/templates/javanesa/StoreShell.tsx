'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Lato, Playfair_Display } from 'next/font/google';
import { Facebook, Instagram, Menu, Search, ShoppingBag, User, X } from 'lucide-react';

import { useCart } from '@/features/commerce/cartStore';
import type { SiteSettings } from '@/features/cms/types';
import styles from './javanesa.module.css';

const fontLato = Lato({
  subsets: ['latin'],
  variable: '--font-lato',
  weight: ['300', '400', '700'],
  display: 'swap',
});

const fontAccent = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-accent',
  style: ['italic'],
  display: 'swap',
});

type Props = {
  siteName: string;
  settings: SiteSettings;
  children: React.ReactNode;
};

export function JavanesaStoreShell({ siteName, settings, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();

  const brandName = siteName.endsWith('.') ? siteName.slice(0, -1) : siteName;
  const headerLogo     = settings.branding.headerLogo;
  const footerLogo     = settings.branding.footerLogo || headerLogo;
  const copyright      = settings.branding.copyrightText?.trim() || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
  const instagramHref  = settings.social?.instagramHref || '';
  const facebookHref   = settings.social?.websiteHref   || '';
  const shippingAnnouncement = 'Free shipping on all orders over Rp 500.000 | Sourced from Yogyakarta, Java';

  const navLinks         = settings.navigation.headerLinks.filter(l => l.enabled);
  const footerNavLinks   = settings.navigation.footerNavigatorLinks?.filter(l => l.enabled) ?? [];
  const footerServiceLinks = settings.navigation.footerServiceLinks?.filter(l => l.enabled) ?? [];

  return (
    <div className={`bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark ${styles.root} ${fontLato.variable} ${fontAccent.variable}`}>

      {/* Announcement bar */}
      <div className="bg-primary text-white text-center py-2 text-xs uppercase tracking-widest font-light">
        {shippingAnnouncement}
      </div>

      {/* Nav */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Mobile hamburger */}
            <div className="flex items-center sm:hidden">
              <button
                className="text-text-light dark:text-text-dark hover:text-primary p-2"
                type="button"
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center justify-center sm:justify-start">
              <Link href="/">
                {headerLogo ? (
                  <Image src={headerLogo} alt={brandName} width={140} height={40} className="h-10 w-auto object-contain" />
                ) : (
                  <span className={`text-2xl font-bold italic tracking-wider text-primary ${styles.fontDisplay}`}>{brandName}</span>
                )}
              </Link>
            </div>

            {/* Desktop nav links */}
            <div className="hidden sm:flex space-x-8 items-center justify-center flex-1">
              {navLinks.length > 0 ? navLinks.map(link => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-sm uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              )) : (
                <>
                  <Link href="/shop"    className="text-sm uppercase tracking-widest hover:text-primary transition-colors">Shop</Link>
                  <Link href="/about"   className="text-sm uppercase tracking-widest hover:text-primary transition-colors">About</Link>
                  <Link href="/contact" className="text-sm uppercase tracking-widest hover:text-primary transition-colors">Contact</Link>
                </>
              )}
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-4">
              <Link href="/search" className="text-text-light dark:text-text-dark hover:text-primary transition-colors" aria-label="Search">
                <Search size={22} />
              </Link>
              <Link href="/account" className="text-text-light dark:text-text-dark hover:text-primary transition-colors" aria-label="Account">
                <User size={22} />
              </Link>
              <Link href="/cart" className="text-text-light dark:text-text-dark hover:text-primary transition-colors relative" aria-label={`Cart (${totalItems})`}>
                <ShoppingBag size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
            <div className="px-4 py-4 space-y-3">
              {navLinks.length > 0 ? navLinks.map(link => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block text-sm uppercase tracking-widest hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )) : (
                <>
                  <Link href="/shop"    className="block text-sm uppercase tracking-widest hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
                  <Link href="/about"   className="block text-sm uppercase tracking-widest hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>About</Link>
                  <Link href="/contact" className="block text-sm uppercase tracking-widest hover:text-primary transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-surface-light dark:bg-surface-dark pt-20 pb-10 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

            {/* Brand column */}
            <div className="lg:col-span-1">
              <Link href="/" className="mb-6 block">
                {footerLogo ? (
                  <Image src={footerLogo} alt={brandName} width={140} height={40} className="h-10 w-auto object-contain" />
                ) : (
                  <span className={`text-3xl font-bold italic tracking-wider text-primary ${styles.fontDisplay}`}>{brandName}</span>
                )}
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                {settings.branding.footerTagline || ''}
              </p>
              <div className="flex space-x-4">
                {instagramHref && (
                  <a href={instagramHref} className="text-gray-400 hover:text-primary transition-colors" aria-label="Instagram">
                    <Instagram size={24} />
                  </a>
                )}
                {facebookHref && (
                  <a href={facebookHref} className="text-gray-400 hover:text-primary transition-colors" aria-label="Website">
                    <Facebook size={24} />
                  </a>
                )}
              </div>
            </div>

            {/* Navigation */}
            {footerNavLinks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-6">Navigation</h4>
                <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  {footerNavLinks.map(link => (
                    <li key={link.id}>
                      <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Services */}
            {footerServiceLinks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-6">Services</h4>
                <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  {footerServiceLinks.map(link => (
                    <li key={link.id}>
                      <Link href={link.href} className="hover:text-primary transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Join Our Ritual</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Subscribe to receive 10% off your first order and insights into Javanese beauty.
              </p>
              <form className="flex flex-col space-y-3" onSubmit={e => e.preventDefault()}>
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
            <p>{copyright}</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms"   className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
