import type { ReactNode } from 'react';

import { StoreShell } from '@/components/shop/StoreShell';

export default function CartLayout({ children }: { children: ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
