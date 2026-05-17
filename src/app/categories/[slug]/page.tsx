import { notFound } from 'next/navigation';

import { ShopGrid } from '@/components/shop/ShopGrid';
import { TemplateShopPage } from '@/components/shop/TemplateShopPage';
import { modules } from '@/config/modules';
import { getProductCategories } from '@/features/commerce/store';
import { getPublishedPage, getSiteSettings } from '@/features/cms/publicApi';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  if (!modules.ENABLE_STORE_MODULE) return {};

  const { slug } = await params;
  const categories = await getProductCategories();
  const category = categories.find((item) => item.slug === slug);

  if (!category) return {};

  return {
    title: `${category.name} Products`,
    description: category.description || `Browse ${category.name} products`,
  };
}

export default async function CategoryProductPage({ params }: Props) {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const { slug } = await params;
  const [settings, homePage, categories] = await Promise.all([
    getSiteSettings(),
    getPublishedPage('home'),
    getProductCategories(),
  ]);

  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const templateId = settings.appearance?.templateId;

  if (templateId !== 'volta' && templateId !== 'javanesa') {
    return (
      <main>
        <section className="bg-white px-4 py-16 text-gray-950 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Product category</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
              {category.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              {category.description || `Browse every active product in ${category.name}.`}
            </p>
          </div>
        </section>
        <ShopGrid initialCategoryId={category.id} />
      </main>
    );
  }

  return (
    <TemplateShopPage
      template={templateId}
      page={homePage}
      initialCategory={category.slug}
      categoryCopy={{
        eyebrow: 'Product category',
        title: category.name,
        description: category.description || `Browse every active product in ${category.name}.`,
      }}
    />
  );
}
