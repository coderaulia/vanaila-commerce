import { notFound } from 'next/navigation';

import { CheckoutPageClient } from '@/components/shop/CheckoutPageClient';
import { modules } from '@/config/modules';

export const metadata = {
  title: 'Checkout'
};

export default function CheckoutPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  return <CheckoutPageClient />;
}
