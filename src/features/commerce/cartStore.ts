'use client';

import { useSyncExternalStore } from 'react';

import type { CartItem } from './types';

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

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (Array.isArray(parsed.items)) {
        state = parsed;
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

function getServerSnapshot(): CartState {
  return { items: [], couponCode: null };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── Actions ────────────────────────────────────────────────────────────────

export function addToCart(productId: string, variantId: string, quantity = 1): void {
  const existing = state.items.find((i) => i.variantId === variantId);
  if (existing) {
    state = {
      ...state,
      items: state.items.map((i) =>
        i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i
      )
    };
  } else {
    state = {
      ...state,
      items: [...state.items, { productId, variantId, quantity }]
    };
  }
  persist();
  emit();
}

export function updateCartQuantity(variantId: string, quantity: number): void {
  if (quantity <= 0) {
    removeFromCart(variantId);
    return;
  }
  state = {
    ...state,
    items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
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
