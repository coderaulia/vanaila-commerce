'use client';

import { usePathname } from 'next/navigation';

import type { SiteSettings } from '@/features/cms/types';

import { CustomCursorProvider } from './CustomCursor';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { StoreFooter } from './shop/StoreFooter';
import { StoreHeader } from './shop/StoreHeader';

type NavItem = {
  href: string;
  label: string;
};

type AppShellProps = {
  siteName: string;
  navItems: NavItem[];
  settings: SiteSettings;
  children: React.ReactNode;
};

export function AppShell({ siteName, navItems, settings, children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStoreRoute =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/cart' ||
    pathname === '/checkout';

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isStoreRoute) {
    return (
      <div className="bg-white text-gray-900 antialiased">
        <StoreHeader siteName={siteName} settings={settings} />
        {children}
        <StoreFooter siteName={siteName} settings={settings} />
      </div>
    );
  }

  return (
    <CustomCursorProvider>
      <div className="v-cursor-none" style={{ background: '#F4F4F0' }}>
        <SiteHeader siteName={siteName} navItems={navItems} settings={settings} />
        <div className="v2-page">{children}</div>
        <SiteFooter siteName={siteName} settings={settings} />
      </div>
    </CustomCursorProvider>
  );
}
