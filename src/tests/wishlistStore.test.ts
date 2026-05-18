import { beforeEach, describe, expect, it } from 'vitest';

import { addToWishlist, clearWishlist, removeFromWishlist, toggleWishlistProduct } from '@/features/commerce/wishlistStore';
import type { Product } from '@/features/commerce/types';

const timestamp = '2026-01-01T00:00:00.000Z';

const product: Product = {
  id: 'product-1',
  title: 'Core Hoodie',
  slug: 'core-hoodie',
  description: '',
  shortDescription: '',
  status: 'active',
  categoryId: null,
  images: ['/hoodie.jpg'],
  featured: false,
  sortOrder: 0,
  seoTitle: '',
  seoDescription: '',
  createdAt: timestamp,
  updatedAt: timestamp,
  variants: []
};

type StoredWishlist = {
  items: Array<{
    productId: string;
    product?: Product;
    addedAt: string;
  }>;
};

function storedWishlist(): StoredWishlist {
  const raw = localStorage.getItem('vanaila_wishlist');
  expect(raw).toBeTruthy();
  return JSON.parse(raw ?? '{}') as StoredWishlist;
}

beforeEach(() => {
  localStorage.clear();
  clearWishlist();
});

describe('wishlist store', () => {
  it('persists product snapshots', () => {
    addToWishlist(product);

    const item = storedWishlist().items[0];
    expect(item.productId).toBe(product.id);
    expect(item.product?.title).toBe(product.title);
    expect(item.addedAt).toBeTruthy();
  });

  it('toggles saved products without duplicates', () => {
    expect(toggleWishlistProduct(product)).toBe(true);
    expect(toggleWishlistProduct({ ...product, title: 'Updated Hoodie' })).toBe(false);

    expect(storedWishlist().items).toHaveLength(0);
  });

  it('removes saved products', () => {
    addToWishlist(product);
    removeFromWishlist(product.id);

    expect(storedWishlist().items).toHaveLength(0);
  });
});
