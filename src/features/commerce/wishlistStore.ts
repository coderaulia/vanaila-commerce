'use client';

import { useSyncExternalStore } from 'react';

import type { Product, WishlistItem } from './types';

type WishlistState = {
  items: WishlistItem[];
};

const STORAGE_KEY = 'vanaila_wishlist';
const EMPTY_WISHLIST: WishlistState = { items: [] };

let state: WishlistState = EMPTY_WISHLIST;
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

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as WishlistState;
    if (Array.isArray(parsed.items)) {
      state = {
        items: parsed.items.filter(
          (item) => item && typeof item === 'object' && typeof item.productId === 'string' && item.productId.length > 0
        )
      };
      emit();
    }
  } catch {
    // ignore invalid local data
  }
}

if (typeof window !== 'undefined') {
  hydrate();
}

function getSnapshot(): WishlistState {
  return state;
}

function getServerSnapshot(): WishlistState {
  return EMPTY_WISHLIST;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function resolveProductId(product: Product | string): string {
  return typeof product === 'string' ? product : product.id;
}

function resolveProduct(product: Product | string): Product | undefined {
  return typeof product === 'string' ? undefined : product;
}

export function addToWishlist(product: Product | string): void {
  const productId = resolveProductId(product);
  const snapshot = resolveProduct(product);
  const existing = state.items.find((item) => item.productId === productId);

  if (existing) {
    state = {
      items: state.items.map((item) =>
        item.productId === productId ? { ...item, product: snapshot ?? item.product } : item
      )
    };
  } else {
    state = {
      items: [
        ...state.items,
        {
          productId,
          product: snapshot,
          addedAt: new Date().toISOString()
        }
      ]
    };
  }

  persist();
  emit();
}

export function removeFromWishlist(productId: string): void {
  state = { items: state.items.filter((item) => item.productId !== productId) };
  persist();
  emit();
}

export function toggleWishlistProduct(product: Product | string): boolean {
  const productId = resolveProductId(product);
  const exists = state.items.some((item) => item.productId === productId);
  if (exists) {
    removeFromWishlist(productId);
    return false;
  }
  addToWishlist(product);
  return true;
}

export function isWishlistProduct(productId: string): boolean {
  return state.items.some((item) => item.productId === productId);
}

export function clearWishlist(): void {
  state = EMPTY_WISHLIST;
  persist();
  emit();
}

export function useWishlist(): WishlistState & { totalItems: number; productIds: Set<string> } {
  const wishlist = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...wishlist,
    totalItems: wishlist.items.length,
    productIds: new Set(wishlist.items.map((item) => item.productId))
  };
}
