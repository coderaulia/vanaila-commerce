import Link from 'next/link';

import type { SiteSettings } from '@/features/cms/types';

type Props = {
  siteName: string;
  settings: SiteSettings;
};

const SHOP_LINKS = [
  { href: '/categories', label: 'All Categories' },
  { href: '/shop?tag=new', label: 'New Arrivals' },
  { href: '/shop?featured=true', label: 'Best Sellers' },
];

const HELP_LINKS = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'FAQ' },
  { href: '/contact', label: 'Shipping & Returns' },
  { href: '/contact', label: 'Size Guide' },
];

export function StoreFooter({ siteName, settings }: Props) {
  const brandName = siteName.endsWith('.') ? siteName.slice(0, -1) : siteName;
  const footerLogo =
    settings.branding.footerLogo || settings.branding.headerLogo || settings.organizationLogo;
  const copyright =
    settings.branding.copyrightText.trim() || `© ${new Date().getFullYear()} ${brandName}.`;

  const socialLinks = [
    { href: settings.social.instagramHref, label: 'Instagram' },
    { href: settings.social.chatHref, label: 'WhatsApp' },
    { href: settings.social.websiteHref, label: 'Website' },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href));

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="space-y-4">
            <Link href="/shop" className="no-underline block">
              {footerLogo ? (
                <img src={footerLogo} alt={brandName} className="h-10 w-auto object-contain" />
              ) : (
                <span
                  className="font-bold text-2xl text-white uppercase leading-none"
                  style={{ fontFamily: 'var(--font-tight, sans-serif)', letterSpacing: '-0.03em' }}
                >
                  {brandName.toLowerCase()}.
                </span>
              )}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              {settings.branding.footerTagline ||
                'Premium streetwear born and crafted in Bandung, Indonesia. Local pride, global standards.'}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4 pt-2">
                {socialLinks.map((s) => (
                  <Link
                    key={`${s.href}-${s.label}`}
                    href={s.href}
                    className="text-gray-400 hover:text-white transition-colors no-underline text-sm"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Shop</h4>
            <ul className="space-y-3">
              {SHOP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm no-underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Help</h4>
            <ul className="space-y-3">
              {HELP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm no-underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-4">Join the Club</h4>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get 10% off your first order and exclusive access to new drops.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email Address"
                className="bg-gray-800 text-white px-4 py-2 flex-1 text-sm focus:outline-none focus:ring-1 focus:ring-white rounded-l-sm border-0 min-w-0"
              />
              <button
                type="submit"
                className="bg-white text-black px-4 py-2 font-bold text-xs uppercase rounded-r-sm hover:bg-gray-200 transition-colors shrink-0"
              >
                JOIN
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>{copyright}</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors no-underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors no-underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
