import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { modules } from '@/config/modules';
import { getSiteSettings } from '@/features/cms/publicApi';
import { JavanesaStoreShell } from '@/components/home/templates/javanesa/StoreShell';
import { VoltaStoreShell } from '@/components/home/templates/volta/StoreShell';

export const metadata = {
  title: 'Search',
};

export default async function SearchLayout({ children }: { children: ReactNode }) {
  if (!modules.ENABLE_STORE_MODULE) notFound();

  const settings = await getSiteSettings();
  const templateId = settings.appearance?.templateId;
  const siteName = settings.general.siteName;

  if (templateId === 'javanesa') {
    return <JavanesaStoreShell siteName={siteName} settings={settings}>{children}</JavanesaStoreShell>;
  }
  if (templateId === 'volta') {
    return <VoltaStoreShell siteName={siteName} settings={settings}>{children}</VoltaStoreShell>;
  }

  return <>{children}</>;
}
