import { notFound } from 'next/navigation';

import { CartPageClient } from '@/components/shop/CartPageClient';
import { modules } from '@/config/modules';

export const metadata = {
  title: 'Shopping Cart',
  robots: { index: false, follow: false }
};

export default function CartPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  return <CartPageClient />;
}
