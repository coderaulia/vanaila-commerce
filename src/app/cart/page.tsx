'use client';

import Link from 'next/link';

import { modules } from '@/config/modules';
import { useCart, updateCartQuantity, removeFromCart } from '@/features/commerce/cartStore';

export default function CartPage() {
  const cart = useCart();

  if (!modules.ENABLE_STORE_MODULE) return null;

  return (
    <main className="cart-page">
      <h1>Shopping Cart</h1>

      {cart.items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary">Continue Shopping</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.variantId} className="cart-item">
                <div className="cart-item-info">
                  <p className="cart-item-title">{item.product?.title || 'Product'}</p>
                  <p className="cart-item-variant">{item.variant?.name || ''}</p>
                  {item.variant && (
                    <p className="cart-item-price">Rp {item.variant.price.toLocaleString('id-ID')}</p>
                  )}
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => removeFromCart(item.variantId)}
                    aria-label="Remove item"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <p className="cart-total-items">{cart.totalItems} item(s)</p>
            <Link href="/checkout" className="btn btn-primary btn-full">
              Proceed to Checkout
            </Link>
            <Link href="/shop" className="btn btn-ghost btn-full">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
