import { notFound } from 'next/navigation';

import { modules } from '@/config/modules';
import { ShopGrid } from '@/components/shop/ShopGrid';
import { ShopHero } from '@/components/shop/ShopHero';

export const metadata = {
  title: 'Shop',
  description: 'Browse our products'
};

export default function ShopPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  return (
    <main>
      <ShopHero />
      <ShopGrid />
    </main>
  );
}
