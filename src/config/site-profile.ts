import type { PageId } from '@/features/cms/types';

export const siteProfile = {
  brand: {
    mark: 'V',
    wordmark: 'vanaila.'
  },
  navigation: {
    primaryPageOrder: ['home', 'about', 'contact'] as const satisfies readonly PageId[],
    fallbackNavigator: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Insights' },
      { href: '/contact', label: 'Contact' }
    ]
  },
  routing: {
    reservedSlugs: ['admin', 'api', 'blog', 'sitemap.xml', 'robots.txt', 'shop', 'categories', 'cart', 'checkout'] as const
  }
} as const;

export function isReservedPublicSlug(slug: string) {
  return siteProfile.routing.reservedSlugs.includes(slug as (typeof siteProfile.routing.reservedSlugs)[number]);
}
