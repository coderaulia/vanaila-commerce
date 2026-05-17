import type { MetadataRoute } from 'next';

import {
  getPublishedBlogPosts,
  getPublishedPages,
  getSiteSettings
} from '@/features/cms/publicApi';
import { modules } from '@/config/modules';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, pages, posts] = await Promise.all([
    getSiteSettings(),
    getPublishedPages(),
    getPublishedBlogPosts()
  ]);

  const indexingBlocked =
    settings.reading.discourageSearchEngines || settings.seo.defaultNoIndex;

  const isLocalhost = /localhost|127\.0\.0\.1/i.test(settings.baseUrl);

  if (!settings.sitemap.enabled || indexingBlocked || isLocalhost) {
    return [];
  }

  const withLastModified = settings.sitemap.includeLastModified;

  const pageEntries: MetadataRoute.Sitemap = settings.sitemap.includePages
    ? pages.map((page) => ({
        url: `${settings.baseUrl}${page.seo.slug ? `/${page.seo.slug}` : ''}`,
        lastModified: withLastModified ? page.updatedAt : undefined,
        changeFrequency: 'weekly',
        priority: page.id === 'home' ? 1 : 0.7
      }))
    : [];

  const blogEntries: MetadataRoute.Sitemap = settings.sitemap.includePosts
    ? posts.map((post) => ({
        url: `${settings.baseUrl}/blog/${post.seo.slug}`,
        lastModified: withLastModified ? post.updatedAt : undefined,
        changeFrequency: 'weekly',
        priority: 0.6
      }))
    : [];

  let storeEntries: MetadataRoute.Sitemap = [];

  if (modules.ENABLE_STORE_MODULE) {
    try {
      const { getProductCategories } = await import('@/features/commerce/store');
      const categories = await getProductCategories();
      storeEntries = [
        {
          url: `${settings.baseUrl}/categories`,
          changeFrequency: 'weekly',
          priority: 0.7,
        },
        ...categories.map((category) => ({
          url: `${settings.baseUrl}/categories/${category.slug}`,
          lastModified: withLastModified ? category.updatedAt : undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.65,
        })),
      ];
    } catch {
      storeEntries = [];
    }
  }

  return [...pageEntries, ...blogEntries, ...storeEntries];
}
