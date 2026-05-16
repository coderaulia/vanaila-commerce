import { notFound } from 'next/navigation';

import { CheckoutPageClient } from '@/components/shop/CheckoutPageClient';
import { modules } from '@/config/modules';
import { getSettings } from '@/features/cms/contentStore';

export const metadata = {
  title: 'Checkout'
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
    />
  );
}
