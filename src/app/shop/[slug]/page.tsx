import { notFound } from 'next/navigation';

import { modules } from '@/config/modules';
import { getProductBySlug } from '@/features/commerce/store';

import { ProductDetail } from '@/components/shop/ProductDetail';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  if (!modules.ENABLE_STORE_MODULE) return {};
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== 'active') return {};
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.shortDescription
  };
}

export default async function ShopProductPage({ params }: Props) {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== 'active') notFound();

  return (
    <main className="shop-product-page">
      <ProductDetail product={product} />
    </main>
  );
}
