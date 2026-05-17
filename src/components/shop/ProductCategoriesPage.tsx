import Link from 'next/link';

import type { ProductCategory } from '@/features/commerce/types';

import javanesaStyles from '@/components/home/templates/javanesa/javanesa.module.css';
import voltaStyles from '@/components/home/templates/volta/volta.module.css';

type TemplateId = 'vanaila' | 'volta' | 'javanesa';

type CategoryWithCount = ProductCategory & {
  productCount: number;
};

type ProductCategoriesPageProps = {
  categories: CategoryWithCount[];
  template: TemplateId;
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&h=1100&fit=crop&q=80',
  'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=900&h=1100&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&h=1100&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=900&h=1100&fit=crop&q=80',
];

function categoryImage(category: ProductCategory, index: number) {
  return category.image || fallbackImages[index % fallbackImages.length]!;
}

function CategoryEmpty({ template }: { template: TemplateId }) {
  const className = template === 'javanesa'
    ? 'rounded-[48px] bg-[#fffaf4] px-6 py-20 text-center text-[#2d2118]'
    : template === 'volta'
      ? 'rounded-[28px] bg-white px-6 py-20 text-center text-[#0A0A0A]'
      : 'rounded-sm border border-gray-200 bg-white px-6 py-20 text-center text-gray-900';

  return (
    <div className={className}>
      <p className="text-lg font-semibold">No product categories yet.</p>
      <p className="mt-2 text-sm opacity-60">Create categories in the admin store manager to publish this page.</p>
    </div>
  );
}

function VoltaCategories({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <div className={`${voltaStyles.root} bg-[#FAFAF9] px-6 py-16 text-[#0A0A0A] sm:px-10 lg:py-24`}>
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A5BD7]">Product categories</p>
            <h1 className="mt-5 max-w-3xl text-6xl font-semibold leading-[0.96] tracking-[-0.04em] sm:text-7xl">
              Shop by the way you compare.
            </h1>
          </div>
          <p className="max-w-xl text-lg leading-8 text-[#6B6B6B]">
            Move straight into each collection, compare active products, and keep the storefront organized around the product families customers already understand.
          </p>
        </div>

        {categories.length === 0 ? (
          <CategoryEmpty template="volta" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className={`${voltaStyles.tile} group block overflow-hidden rounded-[28px] bg-white p-4 text-[#0A0A0A] no-underline shadow-[0_1px_0_rgba(10,10,10,0.06)]`}>
                <div className="aspect-[4/3] overflow-hidden rounded-[24px] bg-[#F4F2EE]">
                  <img src={categoryImage(category, index)} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="grid min-h-[132px] grid-cols-[1fr_auto] gap-4 pt-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2A5BD7]">Collection</p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.03em]">{category.name}</h2>
                    {category.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6B6B6B]">{category.description}</p>}
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-[#F4F2EE] px-3 py-2 text-xs font-semibold text-[#0A0A0A]">
                    {category.productCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JavanesaCategories({ categories }: { categories: CategoryWithCount[] }) {
  const radii = [
    'rounded-[40%_60%_70%_30%/40%_50%_60%_50%]',
    'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]',
    'rounded-[50%_50%_20%_80%/25%_80%_20%_75%]',
  ];

  return (
    <div className={`${javanesaStyles.root} bg-[#fbf7f1] px-6 py-16 text-[#2d2118] sm:px-10 lg:py-24`}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b77945]">Shop by category</p>
          <h1 className={`${javanesaStyles.fontDisplay} mt-5 text-6xl leading-[0.98] sm:text-7xl`}>
            Rituals, arranged by need.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-8 text-[#6c5b4d]">
            Browse every product family through the same soft, botanical language as the Javanesa storefront.
          </p>
        </div>

        {categories.length === 0 ? (
          <CategoryEmpty template="javanesa" />
        ) : (
          <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="group block text-center text-[#2d2118] no-underline">
                <div className={`relative mx-auto mb-6 aspect-[3/4] w-full overflow-hidden bg-[#f1e4d6] p-3 ${radii[index % radii.length]} transition-all duration-700 group-hover:rounded-[44%_56%_48%_52%/52%_44%_56%_48%]`}>
                  <img src={categoryImage(category, index)} alt={category.name} className="h-full w-full rounded-[inherit] object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b77945]">
                  {category.productCount} products
                </p>
                <h2 className={`${javanesaStyles.fontDisplay} mt-2 text-3xl leading-tight`}>{category.name}</h2>
                {category.description && <p className="mx-auto mt-2 line-clamp-2 max-w-sm text-sm leading-6 text-[#6c5b4d]">{category.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VanailaCategories({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <div className="bg-white px-4 py-16 text-gray-950 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Product categories</p>
          <h1 className="mt-5 text-5xl font-semibold leading-none tracking-tight sm:text-6xl">Find the right collection faster.</h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Browse active product families, then jump into filtered product lists that match the current storefront system.
          </p>
        </div>

        {categories.length === 0 ? (
          <CategoryEmpty template="vanaila" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/categories/${category.slug}`} className="group block overflow-hidden rounded-sm border border-gray-200 bg-white text-gray-950 no-underline transition hover:border-gray-950">
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img src={categoryImage(category, index)} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Collection</p>
                    <span className="text-xs text-gray-500">{category.productCount} products</span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">{category.name}</h2>
                  {category.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">{category.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCategoriesPage({ categories, template }: ProductCategoriesPageProps) {
  if (template === 'javanesa') return <JavanesaCategories categories={categories} />;
  if (template === 'volta') return <VoltaCategories categories={categories} />;
  return <VanailaCategories categories={categories} />;
}
