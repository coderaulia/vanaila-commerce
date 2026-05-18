'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Manrope } from 'next/font/google';
import { Search, ShoppingBag, User } from 'lucide-react';

import { useCart } from '@/features/commerce/cartStore';
import type { SiteSettings } from '@/features/cms/types';
import styles from './volta.module.css';

const fontManrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const V = {
  paper:    '#FAFAF9',
  paperWarm:'#F4F2EE',
  ink:      '#0A0A0A',
  mute:     '#6B6B6B',
  hair:     'rgba(10,10,10,0.08)',
  signal:   '#2A5BD7',
  amber:    '#E8843B',
  hairDark: 'rgba(255,255,255,0.10)',
} as const;

function VAnnounce() {
  const items = [
    'Free 2-day shipping on orders over $80',
    'Trade in your old device · up to $400 credit',
    '0% APR financing for 24 months',
    'Extended coverage, instant repair',
  ];
  return (
    <div style={{
      background: V.ink, color: V.paper, height: 36,
      display: 'flex', alignItems: 'center', overflow: 'hidden',
      fontSize: 12, letterSpacing: '0.02em', flexShrink: 0,
    }}>
      <div className={styles.marquee} style={{ display: 'flex', gap: 56, whiteSpace: 'nowrap', paddingLeft: 56 }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: V.amber }}>◆</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

type StoreNavLink = {
  label: string;
  href: string;
};

function dedupeNavLinks(links: StoreNavLink[]): StoreNavLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.href.trim().toLowerCase()}|${link.label.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function VNav({ siteName, navLinks, cartCount }: { siteName: string; navLinks: StoreNavLink[]; cartCount: number }) {
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const fn = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      background: scrolled ? 'rgba(250,250,249,0.88)' : V.paper,
      borderBottom: scrolled ? `1px solid ${V.hair}` : `1px solid ${V.hair}`,
      transition: 'background .3s ease',
      flexShrink: 0,
    }}>
      <div style={{
        height: 60,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '0 40px',
        maxWidth: 1400, margin: '0 auto', width: '100%',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', color: V.ink, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, background: V.ink, color: V.paper,
            borderRadius: 7, fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>{siteName.charAt(0).toUpperCase()}</span>
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em', fontSize: 17 }}>
            {siteName.toUpperCase()}
          </span>
        </Link>

        {/* Center nav */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(l => (
            <Link
              key={`${l.href}-${l.label}`}
              href={l.href}
              className={styles.navLink}
              style={{ textDecoration: 'none', color: V.ink }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Icons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <Link href="/search" className={styles.iconBtn} aria-label="search" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={18} strokeWidth={1.8} />
          </Link>
          <Link href="/account" style={{ color: 'inherit', textDecoration: 'none' }} aria-label="account">
            <button className={styles.iconBtn} type="button" style={{ pointerEvents: 'none' }}>
              <User size={18} strokeWidth={1.8} />
            </button>
          </Link>
          <Link href="/cart" style={{ color: 'inherit', textDecoration: 'none' }} aria-label={`cart (${cartCount})`}>
            <button className={styles.iconBtn} type="button" style={{ position: 'relative', pointerEvents: 'none' }}>
              <ShoppingBag size={18} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 14, height: 14, borderRadius: 999,
                  background: V.signal, color: '#fff', fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{cartCount > 9 ? '9+' : cartCount}</span>
              )}
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function VFooter({ siteName, settings }: { siteName: string; settings: SiteSettings }) {
  const copyright = settings.branding.copyrightText?.trim() || `© ${new Date().getFullYear()} ${siteName} · All rights reserved`;
  const footerNavLinks = settings.navigation.footerNavigatorLinks?.filter(l => l.enabled) ?? [];
  const footerServiceLinks = settings.navigation.footerServiceLinks?.filter(l => l.enabled) ?? [];

  const cols = [
    { h: 'Shop',    links: footerNavLinks.length   ? footerNavLinks.map(l => ({ label: l.label, href: l.href }))    : [{ label: 'All Products', href: '/shop' }, { label: 'New Arrivals', href: '/shop?tag=new' }, { label: 'Best Sellers', href: '/shop?featured=true' }] },
    { h: 'Support', links: footerServiceLinks.length ? footerServiceLinks.map(l => ({ label: l.label, href: l.href })) : [{ label: 'Contact', href: '/contact' }, { label: 'FAQ', href: '/contact' }, { label: 'Shipping', href: '/contact' }] },
    { h: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }] },
  ];

  const socialLinks = [
    settings.social?.instagramHref && { label: 'IG', href: settings.social.instagramHref },
    settings.social?.websiteHref   && { label: 'WEB', href: settings.social.websiteHref },
    settings.social?.chatHref      && { label: 'WA', href: settings.social.chatHref },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer style={{ background: V.ink, color: V.paper, padding: '72px 40px 28px', flexShrink: 0 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `2fr repeat(${cols.length}, 1fr)`,
          gap: 32,
          paddingBottom: 56,
          borderBottom: `1px solid ${V.hairDark}`,
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, background: V.paper, color: V.ink,
                borderRadius: 8, fontWeight: 700,
              }}>{siteName.charAt(0).toUpperCase()}</span>
              <span style={{ fontWeight: 600, fontSize: 18 }}>{siteName.toUpperCase()}</span>
            </div>
            <p style={{ maxWidth: 280, fontSize: 13.5, lineHeight: 1.65, color: 'rgba(250,250,249,0.6)', margin: '0 0 22px' }}>
              {settings.branding.footerTagline || 'Consumer electronics, distilled.'}
            </p>
            {socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {socialLinks.map(s => (
                  <a key={`${s.href}-${s.label}`} href={s.href} style={{
                    width: 36, height: 36, borderRadius: 999,
                    border: `1px solid ${V.hairDark}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, color: 'rgba(250,250,249,0.8)',
                    textDecoration: 'none',
                  }}>{s.label}</a>
                ))}
              </div>
            )}
          </div>

          {cols.map(c => (
            <div key={c.h}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'rgba(250,250,249,0.5)', marginBottom: 18,
              }}>{c.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.links.map(l => (
                  <Link key={`${l.href}-${l.label}`} href={l.href} style={{
                    fontSize: 13.5, color: 'rgba(250,250,249,0.85)',
                    textDecoration: 'none',
                  }}>{l.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          paddingTop: 22, display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'rgba(250,250,249,0.55)',
        }}>
          <span>{copyright}</span>
          <span style={{ display: 'flex', gap: 24 }}>
            <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms"   style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

type Props = {
  siteName: string;
  settings: SiteSettings;
  children: React.ReactNode;
};

export function VoltaStoreShell({ siteName, settings, children }: Props) {
  const { totalItems } = useCart();

  const rawNav = settings.navigation.headerLinks.filter(l => l.enabled);
  const navLinks = rawNav.length
    ? dedupeNavLinks(rawNav.map(l => ({ label: l.label, href: l.href }))).slice(0, 6)
    : [
        { label: 'Shop',       href: '/shop' },
        { label: 'New',        href: '/shop?tag=new' },
        { label: 'About',      href: '/about' },
        { label: 'Contact',    href: '/contact' },
      ];

  return (
    <div
      className={`${styles.root} ${fontManrope.variable}`}
      style={{ background: V.paper, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <VAnnounce />
      <VNav siteName={siteName} navLinks={navLinks} cartCount={totalItems} />
      <main style={{ flex: 1 }}>{children}</main>
      <VFooter siteName={siteName} settings={settings} />
    </div>
  );
}
