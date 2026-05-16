import { notFound } from 'next/navigation';

import { modules } from '@/config/modules';
import { getProductBySlug, queryProducts } from '@/features/commerce/store';

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
  const relatedPayload = await queryProducts({
    status: 'active',
    categoryId: product.categoryId ?? undefined,
    pageSize: 5
  });
  let relatedProducts = relatedPayload.products.filter((item) => item.id !== product.id).slice(0, 4);

  if (relatedProducts.length < 4) {
    const fallbackPayload = await queryProducts({ status: 'active', pageSize: 8 });
    const existingIds = new Set([product.id, ...relatedProducts.map((item) => item.id)]);
    relatedProducts = [
      ...relatedProducts,
      ...fallbackPayload.products.filter((item) => !existingIds.has(item.id))
    ].slice(0, 4);
  }

  return (
    <main>
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </main>
  );
}
