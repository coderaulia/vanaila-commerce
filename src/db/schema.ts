import { pgTable, text, boolean, jsonb, timestamp, integer, uniqueIndex, index, primaryKey, numeric } from 'drizzle-orm/pg-core';

import type {
  BlogPost,
  BlogStatus,
  CmsRevisionPayload,
  HomeBlock,
  PageId,
  PageSection,
  SeoFields,
  SiteSettings
} from '@/features/cms/types';

export const siteSettingsTable = pgTable('site_settings', {
  id: text('id').primaryKey(),
  payload: jsonb('payload').$type<SiteSettings>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
});

export const pagesTable = pgTable(
  'pages',
  {
    id: text('id').$type<PageId>().primaryKey(),
    title: text('title').notNull(),
    navLabel: text('nav_label').notNull(),
    slug: text('slug').notNull(),
    published: boolean('published').notNull(),
    scheduledPublishAt: timestamp('scheduled_publish_at', { withTimezone: true, mode: 'string' }),
    scheduledUnpublishAt: timestamp('scheduled_unpublish_at', { withTimezone: true, mode: 'string' }),
    seo: jsonb('seo').$type<SeoFields>().notNull(),
    sections: jsonb('sections').$type<PageSection[]>().notNull(),
    homeBlocks: jsonb('home_blocks').$type<HomeBlock[] | null>(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    slugUnique: uniqueIndex('pages_slug_unique').on(table.slug)
  })
);

export const blogPostsTable = pgTable(
  'blog_posts',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    excerpt: text('excerpt').notNull(),
    content: text('content').notNull(),
    author: text('author').notNull(),
    tags: jsonb('tags').$type<string[]>().notNull(),
    coverImage: text('cover_image').notNull(),
    status: text('status').$type<BlogStatus>().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
    scheduledPublishAt: timestamp('scheduled_publish_at', { withTimezone: true, mode: 'string' }),
    scheduledUnpublishAt: timestamp('scheduled_unpublish_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
    seo: jsonb('seo').$type<BlogPost['seo']>().notNull()
  },
  (table) => ({
    slugUnique: uniqueIndex('blog_posts_slug_unique').on(table.slug),
    statusIdx: index('blog_posts_status_idx').on(table.status)
  })
);

export const categoriesTable = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    slugUnique: uniqueIndex('categories_slug_unique').on(table.slug)
  })
);

export const postCategoriesTable = pgTable('post_categories', {
  postId: text('post_id').notNull(),
  categoryId: text('category_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
},
  (table) => ({
    postIdIdx: index('post_categories_post_id_idx').on(table.postId),
    categoryIdIdx: index('post_categories_category_id_idx').on(table.categoryId),
    pk: primaryKey({ columns: [table.postId, table.categoryId] })
  })
);

export const mediaAssetsTable = pgTable('media_assets', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  altText: text('alt_text').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  sizeBytes: integer('size_bytes'),
  checksumSha256: text('checksum_sha256'),
  storageProvider: text('storage_provider').notNull(),
  storageKey: text('storage_key'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
});

export const commentsTable = pgTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' })
});

export const adminUsersTable = pgTable(
  'admin_users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'string' })
  },
  (table) => ({
    emailUnique: uniqueIndex('admin_users_email_unique').on(table.email)
  })
);

export const adminSessionsTable = pgTable(
  'admin_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    sessionToken: text('session_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    sessionTokenUnique: uniqueIndex('admin_sessions_token_unique').on(table.sessionToken)
  })
);

export const requestRateLimitsTable = pgTable('request_rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
});

export const adminLoginLockoutsTable = pgTable('admin_login_lockouts', {
  identifier: text('identifier').primaryKey(),
  failedCount: integer('failed_count').notNull(),
  lockoutUntil: timestamp('lockout_until', { withTimezone: true, mode: 'string' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
});

export const adminAuditLogsTable = pgTable(
  'admin_audit_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull(),
    ip: text('ip').notNull(),
    userAgent: text('user_agent').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    actionIdx: index('admin_audit_logs_action_idx').on(table.action),
    createdAtIdx: index('admin_audit_logs_created_at_idx').on(table.createdAt)
  })
);

export const cmsContentRevisionsTable = pgTable(
  'cms_content_revisions',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    label: text('label').notNull(),
    summary: text('summary').notNull(),
    userId: text('user_id'),
    userDisplayName: text('user_display_name'),
    payload: jsonb('payload').$type<CmsRevisionPayload>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    entityIdx: index('cms_content_revisions_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('cms_content_revisions_created_at_idx').on(table.createdAt)
  })
);

export const analyticsEventsTable = pgTable(
  'analytics_events',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    referrer: text('referrer').notNull(),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    visitorId: text('visitor_id').notNull(),
    sessionId: text('session_id').notNull(),
    userAgent: text('user_agent').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    pathIdx: index('analytics_events_path_idx').on(table.path),
    entityIdx: index('analytics_events_entity_idx').on(table.entityType, table.entityId),
    visitorIdx: index('analytics_events_visitor_idx').on(table.visitorId),
    createdAtIdx: index('analytics_events_created_at_idx').on(table.createdAt)
  })
);

export const notificationsTable = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    readIdx: index('notifications_read_idx').on(table.read),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt)
  })
);

export const userDashboardPreferencesTable = pgTable(
  'user_dashboard_preferences',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().unique(),
    widgetOrder: jsonb('widget_order').$type<string[]>().notNull().default([]),
    hiddenWidgets: jsonb('hidden_widgets').$type<string[]>().notNull().default([]),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    userIdUnique: uniqueIndex('user_dashboard_preferences_user_id_unique').on(table.userId)
  })
);

export const redirectsTable = pgTable(
  'redirects',
  {
    id: text('id').primaryKey(),
    fromPath: text('from_path').notNull(),
    toPath: text('to_path').notNull(),
    type: text('type').notNull().default('302'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    fromPathUnique: uniqueIndex('redirects_from_path_unique').on(table.fromPath)
  })
);

export const page404LogTable = pgTable(
  'page_404_log',
  {
    id: text('id').primaryKey(),
    path: text('path').notNull(),
    referrer: text('referrer').notNull(),
    userAgent: text('user_agent').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    pathIdx: index('page_404_log_path_idx').on(table.path),
    createdAtIdx: index('page_404_log_created_at_idx').on(table.createdAt)
  })
);


// ─── Commerce Module ────────────────────────────────────────────────────────

import type {
  CouponType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductReviewStatus,
  ProductStatus
} from '@/features/commerce/types';

export const productCategoriesTable = pgTable(
  'product_categories',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull().default(''),
    parentId: text('parent_id'),
    image: text('image').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    slugUnique: uniqueIndex('product_categories_slug_unique').on(table.slug),
    parentIdx: index('product_categories_parent_idx').on(table.parentId)
  })
);

export const productsTable = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull().default(''),
    shortDescription: text('short_description').notNull().default(''),
    status: text('status').$type<ProductStatus>().notNull().default('draft'),
    categoryId: text('category_id'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    seoTitle: text('seo_title').notNull().default(''),
    seoDescription: text('seo_description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    slugUnique: uniqueIndex('products_slug_unique').on(table.slug),
    statusIdx: index('products_status_idx').on(table.status),
    categoryIdx: index('products_category_idx').on(table.categoryId),
    featuredIdx: index('products_featured_idx').on(table.featured)
  })
);

export const productVariantsTable = pgTable(
  'product_variants',
  {
    id: text('id').primaryKey(),
    productId: text('product_id').notNull(),
    sku: text('sku').notNull(),
    name: text('name').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
    stock: integer('stock').notNull().default(0),
    weight: numeric('weight', { precision: 8, scale: 2 }),
    options: jsonb('options').$type<Record<string, string>>().notNull().default({}),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    productIdx: index('product_variants_product_idx').on(table.productId),
    skuUnique: uniqueIndex('product_variants_sku_unique').on(table.sku)
  })
);

export const customersTable = pgTable(
  'customers',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull().default(''),
    address: text('address').notNull().default(''),
    city: text('city').notNull().default(''),
    province: text('province').notNull().default(''),
    postalCode: text('postal_code').notNull().default(''),
    passwordHash: text('password_hash'),
    totalOrders: integer('total_orders').notNull().default(0),
    totalSpent: numeric('total_spent', { precision: 14, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex('customers_email_unique').on(table.email)
  })
);

export const ordersTable = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    orderNumber: text('order_number').notNull(),
    customerId: text('customer_id').notNull(),
    status: text('status').$type<OrderStatus>().notNull().default('pending_payment'),
    paymentMethod: text('payment_method').$type<PaymentMethod>().notNull(),
    paymentStatus: text('payment_status').$type<PaymentStatus>().notNull().default('pending'),
    paymentReference: text('payment_reference'),
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
    discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0'),
    shippingCost: numeric('shipping_cost', { precision: 14, scale: 2 }).notNull().default('0'),
    total: numeric('total', { precision: 14, scale: 2 }).notNull(),
    couponId: text('coupon_id'),
    shippingName: text('shipping_name').notNull(),
    shippingPhone: text('shipping_phone').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    shippingCity: text('shipping_city').notNull(),
    shippingProvince: text('shipping_province').notNull(),
    shippingPostalCode: text('shipping_postal_code').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    orderNumberUnique: uniqueIndex('orders_order_number_unique').on(table.orderNumber),
    customerIdx: index('orders_customer_idx').on(table.customerId),
    statusIdx: index('orders_status_idx').on(table.status),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt)
  })
);

export const orderItemsTable = pgTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull(),
    productId: text('product_id').notNull(),
    variantId: text('variant_id').notNull(),
    productTitle: text('product_title').notNull(),
    variantName: text('variant_name').notNull(),
    sku: text('sku').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric('total_price', { precision: 14, scale: 2 }).notNull()
  },
  (table) => ({
    orderIdx: index('order_items_order_idx').on(table.orderId),
    productIdx: index('order_items_product_idx').on(table.productId)
  })
);

export const inventoryLogsTable = pgTable(
  'inventory_logs',
  {
    id: text('id').primaryKey(),
    variantId: text('variant_id').notNull(),
    previousStock: integer('previous_stock').notNull(),
    newStock: integer('new_stock').notNull(),
    reason: text('reason').notNull(),
    orderId: text('order_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    variantIdx: index('inventory_logs_variant_idx').on(table.variantId),
    createdAtIdx: index('inventory_logs_created_at_idx').on(table.createdAt)
  })
);

export const productReviewsTable = pgTable(
  'product_reviews',
  {
    id: text('id').primaryKey(),
    productId: text('product_id').notNull(),
    customerId: text('customer_id'),
    authorName: text('author_name').notNull(),
    authorEmail: text('author_email').notNull(),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    status: text('status').$type<ProductReviewStatus>().notNull().default('pending'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    productIdx: index('product_reviews_product_idx').on(table.productId),
    statusIdx: index('product_reviews_status_idx').on(table.status),
    createdAtIdx: index('product_reviews_created_at_idx').on(table.createdAt)
  })
);

export const couponsTable = pgTable(
  'coupons',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    type: text('type').$type<CouponType>().notNull(),
    value: numeric('value', { precision: 12, scale: 2 }).notNull(),
    minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 2 }),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    active: boolean('active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    codeUnique: uniqueIndex('coupons_code_unique').on(table.code),
    activeIdx: index('coupons_active_idx').on(table.active)
  })
);

export const customerSessionsTable = pgTable(
  'customer_sessions',
  {
    id: text('id').primaryKey(),
    customerId: text('customer_id').notNull(),
    sessionToken: text('session_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull()
  },
  (table) => ({
    sessionTokenUnique: uniqueIndex('customer_sessions_token_unique').on(table.sessionToken),
    customerIdx: index('customer_sessions_customer_idx').on(table.customerId)
  })
);
