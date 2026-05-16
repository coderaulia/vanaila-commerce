import { notFound, redirect } from 'next/navigation';

import { modules } from '@/config/modules';
import { ShopGrid } from '@/components/shop/ShopGrid';
import { ShopHero } from '@/components/shop/ShopHero';
import { VanailaRedesignHome } from '@/components/home/VanailaRedesignHome';
import { MarketingPageRenderer } from '@/components/MarketingPageRenderer';
import { buildMetadata } from '@/features/cms/seo';
import { getPublishedPage, getSiteSettings } from '@/features/cms/publicApi';

import '@/components/shop/store.css';

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
  if (modules.ENABLE_STORE_MODULE) {
    return (
      <main>
        <ShopHero />
        <ShopGrid />
      </main>
    );
  }

  const [settings, homePage] = await Promise.all([
    getSiteSettings(),
    getPublishedPage('home')
  ]);

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
    return <VanailaRedesignHome page={homePage} />;
  }
  return <MarketingPageRenderer page={homePage} />;
}
