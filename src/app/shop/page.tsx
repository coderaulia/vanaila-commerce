import { modules } from '@/config/modules';
import { notFound } from 'next/navigation';

import { ShopGrid } from '@/components/shop/ShopGrid';

export const metadata = {
  title: 'Shop',
  description: 'Browse our products'
};

export default function ShopPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <h1>Shop</h1>
        <p>Browse our collection of products</p>
      </section>
      <ShopGrid />
    </main>
  );
}
