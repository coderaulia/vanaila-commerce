import type { ReactNode } from 'react';

import './store.css';

type Props = {
  children: ReactNode;
};

export function StoreShell({ children }: Props) {
  return <div className="store-shell">{children}</div>;
}
