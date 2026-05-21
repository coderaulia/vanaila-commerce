'use client';

import { useSyncExternalStore } from 'react';

import type { CartItem, Product, ProductVariant } from './types';

type CartState = {
  items: CartItem[];
  couponCode: string | null;
};

const STORAGE_KEY = 'vanaila_cart';

let state: CartState = { items: [], couponCode: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false;
  const i = item as Record<string, unknown>;
  return typeof i.variantId === 'string' && i.variantId.length > 0;
}

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (Array.isArray(parsed.items)) {
        state = {
          items: parsed.items.filter(isValidCartItem).map((i) => ({
            ...i,
            quantity: Math.min(99, Math.max(1, Math.floor(Number(i.quantity) || 1)))
          })),
          couponCode: typeof parsed.couponCode === 'string' ? parsed.couponCode : null
        };
        emit();
      }
    }
  } catch {
    // ignore
  }
}

// Hydrate on module load (client only)
if (typeof window !== 'undefined') {
  hydrate();
}

function getSnapshot(): CartState {
  return state;
}

const EMPTY_CART: CartState = { items: [], couponCode: null };

function getServerSnapshot(): CartState {
  return EMPTY_CART;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function normalizeQuantity(quantity: number): number {
  return Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
}

function resolveProductId(product: Product | string): string {
  return typeof product === 'string' ? product : product.id;
}

function resolveVariantId(variant: ProductVariant | string): string {
  return typeof variant === 'string' ? variant : variant.id;
}

function resolveProduct(product: Product | string): Product | undefined {
  return typeof product === 'string' ? undefined : product;
}

function resolveVariant(variant: ProductVariant | string): ProductVariant | undefined {
  return typeof variant === 'string' ? undefined : variant;
}

// ─── Actions ────────────────────────────────────────────────────────────────

export function addToCart(product: Product, variant: ProductVariant, quantity?: number): void;
export function addToCart(productId: string, variantId: string, quantity?: number): void;
export function addToCart(
  productOrId: Product | string,
  variantOrId: ProductVariant | string,
  quantity = 1
): void {
  const productId = resolveProductId(productOrId);
  const variantId = resolveVariantId(variantOrId);
  const product = resolveProduct(productOrId);
  const variant = resolveVariant(variantOrId);
  const safeQuantity = normalizeQuantity(quantity);
  const existing = state.items.find((i) => i.variantId === variantId);
  if (existing) {
    state = {
      ...state,
      items: state.items.map((i) =>
        i.variantId === variantId
          ? {
              ...i,
              product: product ?? i.product,
              variant: variant ?? i.variant,
              quantity: i.quantity + safeQuantity
            }
          : i
      )
    };
  } else {
    state = {
      ...state,
      items: [...state.items, { productId, variantId, quantity: safeQuantity, product, variant }]
    };
  }
  persist();
  emit();
}

export function updateCartQuantity(variantId: string, quantity: number): void {
  const safeQuantity = Math.floor(quantity);
  if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
    removeFromCart(variantId);
    return;
  }
  const current = state.items.find((i) => i.variantId === variantId);
  const stock = current?.variant?.stock;
  const nextQuantity = typeof stock === 'number' && stock > 0 ? Math.min(safeQuantity, stock) : safeQuantity;
  state = {
    ...state,
    items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity: nextQuantity } : i))
  };
  persist();
  emit();
}

export function removeFromCart(variantId: string): void {
  state = {
    ...state,
    items: state.items.filter((i) => i.variantId !== variantId)
  };
  persist();
  emit();
}

export function clearCart(): void {
  state = { items: [], couponCode: null };
  persist();
  emit();
}

export function setCouponCode(code: string | null): void {
  state = { ...state, couponCode: code };
  persist();
  emit();
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCart(): CartState & { totalItems: number } {
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  return { ...cart, totalItems };
}
