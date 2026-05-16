import { notFound } from 'next/navigation';

import { modules } from '@/config/modules';
import { ShopGrid } from '@/components/shop/ShopGrid';
import { ShopHero } from '@/components/shop/ShopHero';
import { TemplateShopPage } from '@/components/shop/TemplateShopPage';
import { getPublishedPage, getSiteSettings } from '@/features/cms/publicApi';

export const metadata = {
  title: 'Shop',
  description: 'Browse our products'
};

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
