import { notFound, redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

import { modules } from '@/config/modules';
import { ShopGrid } from '@/components/shop/ShopGrid';
import { ShopHero } from '@/components/shop/ShopHero';
import { TemplateShopPage } from '@/components/shop/TemplateShopPage';
import { MarketingPageRenderer } from '@/components/MarketingPageRenderer';
import { buildMetadata } from '@/features/cms/seo';
import { getPublishedPage, getSiteSettings } from '@/features/cms/publicApi';
import type { Product, ProductCategory } from '@/features/commerce/types';

const JavanesaHome = dynamic(() =>
  import('@/components/home/templates/javanesa').then((m) => ({ default: m.JavanesaHome }))
);
const VoltaHome = dynamic(() =>
  import('@/components/home/templates/volta').then((m) => ({ default: m.VoltaHome }))
);
const VanailaRedesignHome = dynamic(() =>
  import('@/components/home/templates/vanaila').then((m) => ({ default: m.VanailaRedesignHome }))
);

export async function generateMetadata() {
  if (modules.ENABLE_STORE_MODULE) {
    return { title: 'Shop' };
  }
  const [settings, page] = await Promise.all([getSiteSettings(), getPublishedPage('home')]);
  if (!page) {
    return { title: 'Not found' };
  }
  return buildMetadata(settings, page.seo, page.title, page.seo.metaDescription);
}

export default async function HomePage() {
  const settings = await getSiteSettings();

  if (modules.ENABLE_STORE_MODULE) {
    const templateId = settings.appearance?.templateId;
    const homePage = await getPublishedPage('home');

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

  const homePage = await getPublishedPage('home');

  if (settings.reading.homepageDisplay === 'latest_posts') {
    redirect('/blog');
  }

  if (settings.reading.homepagePageId && settings.reading.homepagePageId !== 'home') {
    const targetPage = await getPublishedPage(settings.reading.homepagePageId);
    if (targetPage) {
      redirect(targetPage.seo.slug ? `/${targetPage.seo.slug}` : '/');
    }
  }

  if (!homePage) notFound();

  if (homePage.homeBlocks && homePage.homeBlocks.length > 0) {
    const templateId = settings.appearance?.templateId ?? 'vanaila';

    if (templateId === 'javanesa') {
      let featuredProducts: Product[] = [];
      let productCategories: ProductCategory[] = [];
      try {
        const { queryProducts, getProductCategories } = await import('@/features/commerce/store');
        const [{ products }, cats] = await Promise.all([
          queryProducts({ status: 'active', featured: true, pageSize: 4 }),
          getProductCategories()
        ]);
        featuredProducts = products;
        productCategories = cats.slice(0, 4);
      } catch {
        // DATABASE_URL not configured or DB unavailable — template renders with empty data
      }
      return <JavanesaHome page={homePage} settings={settings} products={featuredProducts} categories={productCategories} />;
    }

    if (templateId === 'volta')    return <VoltaHome page={homePage} settings={settings} />;
    return <VanailaRedesignHome page={homePage} />;
  }
  return <MarketingPageRenderer page={homePage} />;
}
