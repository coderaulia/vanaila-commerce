import { NextResponse } from 'next/server';

import { modules } from '@/config/modules';
import { assertAdminRequest } from '@/features/cms/adminAuth';
import { getPages } from '@/features/cms/contentStore';

export async function GET(request: Request) {
  const auth = await assertAdminRequest(request);
  if (auth instanceof NextResponse) return auth;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const session = auth;

  const pages = await getPages();
  const ordered = [
    'home',
    'about',
    'contact'
  ]
    .map((id) => pages[id as keyof typeof pages])
    .filter(Boolean);
  return NextResponse.json({ pages: ordered, storefrontEnabled: modules.ENABLE_STORE_MODULE });
}
