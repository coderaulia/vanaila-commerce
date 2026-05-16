import { beforeEach, describe, expect, it } from 'vitest';

import { addToCart, clearCart, updateCartQuantity } from '@/features/commerce/cartStore';
import type { Product, ProductVariant } from '@/features/commerce/types';

type StoredCart = {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    product?: Product;
    variant?: ProductVariant;
  }>;
  couponCode: string | null;
};

const timestamp = '2026-01-01T00:00:00.000Z';

const variant: ProductVariant = {
  id: 'variant-1',
  productId: 'product-1',
  sku: 'HOODIE-BLK-M',
  name: 'Black / M',
  price: 125000,
  compareAtPrice: null,
  stock: 5,
  weight: null,
  options: { Color: 'Black', Size: 'M' },
  sortOrder: 0,
  createdAt: timestamp,
  updatedAt: timestamp
};

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
  variants: [variant]
};

function storedCart(): StoredCart {
  const raw = localStorage.getItem('vanaila_cart');
  expect(raw).toBeTruthy();
  return JSON.parse(raw ?? '{}') as StoredCart;
}

beforeEach(() => {
  localStorage.clear();
  clearCart();
});

describe('cart store', () => {
  it('persists product and variant snapshots for cart rendering', () => {
    addToCart(product, variant, 2);

    const item = storedCart().items[0];
    expect(item.productId).toBe(product.id);
    expect(item.variantId).toBe(variant.id);
    expect(item.quantity).toBe(2);
    expect(item.product?.title).toBe('Core Hoodie');
    expect(item.variant?.price).toBe(125000);
  });

  it('merges duplicate variants and refreshes the latest snapshot', () => {
    addToCart(product, variant, 1);
    addToCart({ ...product, title: 'Core Hoodie Updated' }, { ...variant, price: 130000 }, 2);

    const item = storedCart().items[0];
    expect(storedCart().items).toHaveLength(1);
    expect(item.quantity).toBe(3);
    expect(item.product?.title).toBe('Core Hoodie Updated');
    expect(item.variant?.price).toBe(130000);
  });

  it('caps quantity to known stock and removes zero quantity items', () => {
    addToCart(product, variant, 1);
    updateCartQuantity(variant.id, 99);

    expect(storedCart().items[0].quantity).toBe(5);

    updateCartQuantity(variant.id, 0);
    expect(storedCart().items).toHaveLength(0);
  });
});
