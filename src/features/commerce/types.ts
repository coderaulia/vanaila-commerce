export type ProductStatus = 'draft' | 'active' | 'archived';

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  weight: number | null;
  options: Record<string, string>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  status: ProductStatus;
  categoryId: string | null;
  images: string[];
  featured: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  image: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'midtrans' | 'manual_transfer';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  couponId: string | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type Customer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryLog = {
  id: string;
  variantId: string;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId: string | null;
  createdAt: string;
};

export type CouponType = 'percentage' | 'fixed_amount';

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  productId: string;
  variantId: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
};

export type Cart = {
  items: CartItem[];
  couponCode: string | null;
};

export type CheckoutPayload = {
  items: Array<{ variantId: string; quantity: number }>;
  customer: {
    email: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
};
