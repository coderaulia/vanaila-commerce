import { notFound } from 'next/navigation';

import { CheckoutPageClient } from '@/components/shop/CheckoutPageClient';
import { modules } from '@/config/modules';
import { getSettings } from '@/features/cms/contentStore';
import { env } from '@/services/env';

export const metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false }
};

export default async function CheckoutPage() {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const settings = await getSettings();
  const { payments: paymentSettings, store: storeSettings } = settings;

  return (
    <CheckoutPageClient
      midtransEnabled={paymentSettings.midtransEnabled}
      manualTransferEnabled={paymentSettings.manualTransferEnabled}
      freeShippingThreshold={storeSettings.freeShippingThreshold}
      minOrderAmount={storeSettings.minOrderAmount}
      shippingQuotesEnabled={Boolean(env.rajaOngkirApiKey && env.shippingOriginId)}
    />
  );
}
