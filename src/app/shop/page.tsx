import { notFound } from 'next/navigation';

import { modules } from '@/config/modules';
import { ShopGrid } from '@/components/shop/ShopGrid';
import { ShopHero } from '@/components/shop/ShopHero';
import { TemplateShopPage } from '@/components/shop/TemplateShopPage';
import { getPublishedPage, getSiteSettings } from '@/features/cms/publicApi';
import { buildMetadata } from '@/features/cms/seo';

export async function generateMetadata() {
  if (!modules.ENABLE_STORE_MODULE) return {};
  const settings = await getSiteSettings();
  return buildMetadata(
    settings,
    {
      metaTitle: '',
      metaDescription: '',
      slug: 'shop',
      canonical: '',
      socialImage: settings.seo.defaultOgImage,
      noIndex: false,
      keywords: []
    },
    `Shop | ${settings.general.siteName}`,
    settings.seo.defaultMetaDescription || 'Browse our products'
  );
}

export default async function ShopPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const [settings, homePage] = await Promise.all([getSiteSettings(), getPublishedPage('home')]);
  const templateId = settings.appearance?.templateId;

  if (templateId === 'volta' || templateId === 'javanesa') {
    return <TemplateShopPage template={templateId} page={homePage} />;
  }

  return (
    <main>
      <ShopHero />
      <ShopGrid />
    </main>
  );
}
