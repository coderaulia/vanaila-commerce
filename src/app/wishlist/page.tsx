import { notFound } from 'next/navigation';

import { WishlistPageClient } from '@/components/shop/WishlistPageClient';
import { modules } from '@/config/modules';

export const metadata = {
  title: 'Wishlist',
  robots: { index: false, follow: false }
};

export default function WishlistPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  return <WishlistPageClient />;
}
