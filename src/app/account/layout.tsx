import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { modules } from '@/config/modules';

export const metadata = {
  robots: { index: false, follow: false }
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  if (!modules.ENABLE_STORE_MODULE) notFound();
  return <>{children}</>;
}
