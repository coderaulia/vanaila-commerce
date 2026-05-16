'use client';

import { usePathname } from 'next/navigation';

import type { SiteSettings } from '@/features/cms/types';
import { modules } from '@/config/modules';
import { getTemplate } from '@/config/templates';
import { JavanesaStoreShell } from './home/templates/javanesa/StoreShell';
import { VoltaStoreShell } from './home/templates/volta/StoreShell';

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

  const template = getTemplate(settings.appearance?.templateId ?? 'vanaila');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  const isStoreRoute =
    (modules.ENABLE_STORE_MODULE && pathname === '/') ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/cart' ||
    pathname === '/checkout';

  // Store routes: use template-specific shell for selfContained templates
  if (isStoreRoute && template.selfContained) {
    if (template.id === 'volta') {
      return <VoltaStoreShell siteName={siteName} settings={settings}>{children}</VoltaStoreShell>;
    }
    if (template.id === 'javanesa') {
      return <JavanesaStoreShell siteName={siteName} settings={settings}>{children}</JavanesaStoreShell>;
    }
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

  // Homepage: selfContained marketing templates own their full layout.
  if (template.selfContained && pathname === '/') {
    return <>{children}</>;
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
