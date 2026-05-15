'use client';

import { useState } from 'react';

import type { Product, ProductVariant } from '@/features/commerce/types';
import { addToCart } from '@/features/commerce/cartStore';

type Props = {
  product: Product;
};

export function ProductDetail({ product }: Props) {
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addToCart(product.id, selectedVariant.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="product-detail">
      <div className="product-detail-images">
        {product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.title} className="product-detail-main-image" />
        ) : (
          <div className="product-detail-no-image">No image</div>
        )}
        {product.images.length > 1 && (
          <div className="product-detail-gallery">
            {product.images.slice(1).map((img, i) => (
              <img key={i} src={img} alt={`${product.title} ${i + 2}`} loading="lazy" />
            ))}
          </div>
        )}
      </div>

      <div className="product-detail-info">
        <h1>{product.title}</h1>
        {product.shortDescription && <p className="product-short-desc">{product.shortDescription}</p>}

        {selectedVariant && (
          <div className="product-price">
            {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price && (
              <span className="product-price-compare">
                Rp {selectedVariant.compareAtPrice.toLocaleString('id-ID')}
              </span>
            )}
            <span className="product-price-current">
              Rp {selectedVariant.price.toLocaleString('id-ID')}
            </span>
          </div>
        )}

        {variants.length > 1 && (
          <div className="product-variants">
            <label className="product-variant-label">Variant</label>
            <select
              value={selectedVariant?.id || ''}
              onChange={(e) => setSelectedVariant(variants.find((v) => v.id === e.target.value) || null)}
              className="product-variant-select"
              aria-label="Select variant"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — Rp {v.price.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedVariant && selectedVariant.stock > 0 ? (
          <div className="product-add-to-cart">
            <div className="product-qty">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleAddToCart}>
              {added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <p className="product-stock">{selectedVariant.stock} in stock</p>
          </div>
        ) : (
          <p className="product-out-of-stock">Out of stock</p>
        )}

        {product.description && (
          <div className="product-description">
            <h2>Description</h2>
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}
      </div>
    </div>
  );
}
