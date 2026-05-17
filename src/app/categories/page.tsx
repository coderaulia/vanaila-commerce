import { notFound } from 'next/navigation';

import { ProductCategoriesPage } from '@/components/shop/ProductCategoriesPage';
import { modules } from '@/config/modules';
import { getProductCategories, queryProducts } from '@/features/commerce/store';
import { getSiteSettings } from '@/features/cms/publicApi';

export const metadata = {
  title: 'Product Categories',
  description: 'Browse product categories and collections'
};

export default async function CategoriesPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getProductCategories(),
  ]);

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { meta } = await queryProducts({
        status: 'active',
        categoryId: category.id,
        pageSize: 1,
      });

      return {
        ...category,
        productCount: meta.total,
      };
    })
  );

  const templateId = settings.appearance?.templateId;
  const template = templateId === 'volta' || templateId === 'javanesa' ? templateId : 'vanaila';

  return <ProductCategoriesPage categories={categoriesWithCounts} template={template} />;
}
