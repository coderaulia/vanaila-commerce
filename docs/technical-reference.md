# Technical Reference

This document holds implementation-level details that are useful for developers and operators but too detailed for the root README.

## Stack

- Framework: Next.js App Router
- Runtime: Node.js 20+
- Language: TypeScript strict mode
- UI: React 19 and Tailwind CSS
- Database: PostgreSQL-compatible database through Drizzle ORM
- Storage: Cloudflare R2, Supabase Storage, or local disk fallback
- Tests: Vitest with jsdom

## Key Commands

```bash
# Development
npm run dev
npm run build
npm run start

# Quality gate
npm run lint
npm run typecheck
npm run test
npm run check

# Database
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:seed:file
npm run db:reseed

# Media
npm run media:migrate:supabase:dry
npm run media:migrate:supabase

# Client bootstrap
npm run bootstrap:client -- --output ../acme-cms --site-name "Acme Studio"
npm run bootstrap:client -- --config ./docs/client-bootstrap.example.json

# Size auditing
npm run audit:src
npm run audit:size
npm run build:audit
```

## Architecture

The CMS has two persistence modes:

- `DATABASE_URL` set: PostgreSQL through Drizzle.
- `DATABASE_URL` not set: local JSON file at `data/content.json`.

All CMS reads and writes should flow through `src/features/cms/contentStore.ts`, which delegates to the active store through `storeAdapter.ts`.

Public page render flow:

```txt
src/app/page.tsx or src/app/[slug]/page.tsx
  -> src/features/cms/publicApi.ts
  -> src/features/cms/storeAdapter.ts
  -> database or file store
  -> cached public output
```

Admin mutation flow:

```txt
src/app/admin/*
  -> src/app/api/admin/*
  -> assertAdminRequest or assertAdminPermission
  -> validators
  -> contentStore
  -> public cache revalidation
```

## Important Directories

```txt
src/
  app/              # public pages, admin pages, API routes, sitemap, robots
  components/       # public UI, admin UI, forms, home blocks, page views, shop
  config/           # site profile, feature flags (modules.ts)
  db/               # Drizzle schema and database client
  features/
    bootstrap/      # client starter generator
    cms/            # CMS types, stores, validators, auth, SEO, analytics
    commerce/       # E-commerce: products, orders, checkout, cart, emails
  lib/              # shared utilities
  services/         # env parsing, media storage, request security
  tests/            # Vitest tests
data/
  content.json      # local file-store content, generated locally
docs/
  *.md              # detailed operating docs
```

## Content Model

### Landing Pages

Landing pages include:

- `id`
- `title`
- `navLabel`
- `published`
- `seo`
- `sections[]` for standard pages
- `homeBlocks[]` for the home page

Seeded page IDs currently include:

- `home`
- `about`
- `service`
- `service-website-development`
- `service-custom-business-tools`
- `service-secure-online-shops`
- `service-mobile-business-app`
- `service-official-business-email`
- `partnership`
- `contact`

The home page uses a typed block model with these block types:

- `hero`
- `value_triplet`
- `solutions_grid`
- `why_split`
- `logo_cloud`
- `primary_cta`

### Blog Posts

Blog posts include:

- `id`
- `title`
- `excerpt`
- `content`
- `author`
- `tags[]`
- `categoryId`
- `coverImage`
- `status`
- `publishedAt`
- `updatedAt`
- `seo`

### Portfolio Projects

Portfolio projects support draft/published workflows, featured state, cover image, gallery media, tags, SEO fields, scheduled publishing, and revision restore.

### Site Settings

Settings are grouped by admin tab:

- `general`
- `writing`
- `reading`
- `discussion`
- `media`
- `permalinks`
- `seo`
- `sitemap`

Flexible content stays in JSONB when using Postgres. Search/filter facets are normalized through categories, post-category joins, portfolio tags, and portfolio-tag joins.

## Admin Blog API

`GET /api/admin/blog` supports:

- `includeDrafts=1`
- `q`
- `status=all|draft|published`
- `category`
- `dateSort=newest|oldest`
- `page`
- `pageSize`

Response shape:

```json
{
  "posts": [],
  "meta": {
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "categories": []
  }
}
```

## SEO Behavior

The public site supports:

- per-page, per-post, and per-project metadata controls
- global SEO defaults from Website Settings
- canonical URLs
- Open Graph and Twitter tags
- sitemap generation at `/sitemap.xml`
- robots output at `/robots.txt`
- Organization and WebSite JSON-LD globally
- BlogPosting JSON-LD on blog detail pages

Sitemap and robots output respect indexing settings from Website Settings.

## Admin Auth And Security

Admin uses cookie sessions in database mode. The first login can bootstrap an admin user from environment variables when the admin table is empty.

Core protections:

- role-based permissions (`super_admin`, `admin`, `editor`, `analyst`, `store_manager`)
- CSRF checks for state-changing requests
- same-origin mutation checks
- login lockouts
- rate limiting
- audit logs
- server-side validation for untrusted input

Legacy token auth is limited to explicitly enabled development scenarios.

## Media Storage

Runtime provider priority:

1. Cloudflare R2
2. Supabase Storage
3. Local disk

Production should use R2 or Supabase Storage. Local disk is only a fallback for development or simple self-hosted environments with persistent storage.

Uploaded media is size-limited, MIME-checked, tracked in the media library, and protected from deletion while still referenced by content.


## Commerce Module

The e-commerce module is optional and controlled by the `ENABLE_STORE_MODULE` environment variable. When disabled, all commerce routes return 404.

### Feature Flag

```ts
// src/config/modules.ts
export const modules = {
  get ENABLE_STORE_MODULE() {
    return process.env.ENABLE_STORE_MODULE === 'true';
  }
};
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `product_categories` | Hierarchical product categories |
| `products` | Product catalog (title, slug, status, images, SEO) |
| `product_variants` | SKU-level pricing, stock, weight, options |
| `customers` | Customer records with aggregated order stats |
| `customer_sessions` | Customer account sessions |
| `orders` | Order header (shipping, payment, totals, status) |
| `order_items` | Line items per order |
| `inventory_logs` | Stock change audit trail |
| `coupons` | Discount codes (percentage or fixed amount) |
| `product_reviews` | Customer product reviews and moderation status |

### Public Store API

```
GET  /api/store/products          # Active products (paginated, filterable)
GET  /api/store/products/[slug]   # Single product with variants
GET  /api/store/categories        # All product categories
POST /api/store/checkout          # Place order
POST /api/store/payment/midtrans  # Midtrans webhook (signature-verified)
GET  /api/store/reviews?productId=... # Check logged-in customer review eligibility
POST /api/store/reviews           # Submit purchased-product review
```

### Customer Account API

Customer account routes require the `customer_session` cookie except for login/register.

```
POST /api/account/register        # Create account and session
POST /api/account/login           # Create session
POST /api/account/logout          # Clear session
GET  /api/account/me              # Current customer profile
PUT  /api/account/profile         # Update profile/default address
GET  /api/account/orders          # Current customer orders
GET  /api/account/reviews         # Current customer product reviews
```

### Admin Store API

All admin store routes require authentication and appropriate permissions.

```
GET/POST    /api/admin/products              # List/create (store:edit)
GET/PUT/DEL /api/admin/products/[id]         # CRUD (store:edit)
POST/PUT/DEL /api/admin/products/[id]/variants # Variant management (store:edit)
GET         /api/admin/orders                # List (store:manage_orders)
GET/PUT     /api/admin/orders/[id]           # Detail/status update (store:manage_orders)
GET         /api/admin/customers             # List (store:manage_customers)
GET/POST    /api/admin/reviews               # List/update product review moderation (store:edit)
```

### Payment Flow

**Midtrans (online):**

1. Customer submits checkout → `processCheckout()` creates order + calls Midtrans Snap API
2. Customer is redirected to Midtrans payment page
3. Midtrans sends webhook to `/api/store/payment/midtrans`
4. Webhook verifies SHA-512 signature and updates payment/order status

**Manual transfer:**

1. Customer submits checkout → order created with `pending_payment` status
2. Customer sees bank transfer instructions on confirmation page
3. Admin confirms payment in order detail → status moves to `paid`

### Cart Architecture

Client-side only. Uses React `useSyncExternalStore` with localStorage persistence. No server-side cart state. Key: `vanaila_cart`.

### Order Emails

Sent via Resend API. Two email types:

- Order confirmation (on checkout)
- Status update (on admin status change)

Both fail silently — email failures never block order processing.

### RBAC

New role `store_manager` with permissions:

- `store:view` — view store admin sections
- `store:edit` — create/edit/delete products and variants
- `store:manage_orders` — view and update order status
- `store:manage_customers` — view customer list

`super_admin` and `admin` roles also receive all store permissions.

### Public Routes

| Route | Type | Description |
|-------|------|-------------|
| `/shop` | Dynamic | Product grid with search and category filter |
| `/shop/[slug]` | Dynamic | Product detail with variant selection |
| `/cart` | Client | Shopping cart (client-side state) |
| `/checkout` | Client | Checkout form |
| `/shop/order/[id]` | Dynamic | Order confirmation |
| `/wishlist` | Client | Saved products using local wishlist state |
| `/account` | Client | Customer dashboard with orders, profile, wishlist, reviews, and shop shortcuts |
| `/account/profile` | Client | Customer profile/default address editor |
| `/account/reviews` | Client | Customer-owned review history and moderation status |
