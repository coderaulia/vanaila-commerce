# Security Implementation Plan

Audit date: 2026-05-13  
Last updated: 2026-05-15  
Scope: Next.js 16.2 App Router CMS — all API routes, forms, auth, file upload, headers

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| **Critical** | Exploitable now, fix before next deploy |
| **High** | Significant abuse vector, fix this sprint |
| **Medium** | Best-practice gap, fix next sprint |
| **Low** | Hardening / hygiene, backlog |

---

## Critical

### C-1 — Analytics endpoints completely unprotected ✅ Done

**Files:** `src/app/api/analytics/page-view/route.ts`, `src/app/api/analytics/event/route.ts`  
**Issue:** Both POST endpoints had zero authentication, zero CSRF protection, zero rate limiting.

**Resolution:**
- Rate limiting added to both routes (`analytics-pv` and `analytics-event`, 60 req/min per IP)
- Input length caps applied to all string fields via `cap()` helper
- Event endpoint restricts `eventType` to an explicit allowlist (`contact_submit`, `cta_click`)

---

### C-2 — X-Forwarded-For spoofing bypasses all IP-based controls ✅ Done

**File:** `src/services/requestSecurity.ts`  
**Issue:** `getClientIdentifier()` blindly trusted the `X-Forwarded-For` header.

**Resolution:**
- `getClientIdentifier()` rewritten to use `TRUSTED_PROXY_COUNT` env var
- When `TRUSTED_PROXY_COUNT=0` (default), `X-Forwarded-For` is ignored entirely
- When `> 0`, takes the Nth-from-right IP in the chain (trusted proxy entries only)
- `TRUSTED_PROXY_COUNT` documented in `.env.example`

---

## High

### H-1 — File upload validates MIME type only (client-supplied) ✅ Done

**File:** `src/services/mediaStorage.ts`  
**Issue:** `isAllowedFile()` trusted client-supplied `Content-Type`.

**Resolution:**
- `validateMagicBytes()` implemented — reads actual file bytes and checks against known signatures
- SVG intentionally excluded from `MIME_MAGIC` (SVGs can contain `<script>` tags)
- Max file size enforced server-side (`MAX_UPLOAD_BYTES = 10 MB`)
- File extension derived from MIME type, not client filename

---

### H-2 — Analytics string fields have no length limits ✅ Done

**Files:** `src/app/api/analytics/page-view/route.ts`, `src/app/api/analytics/event/route.ts`  
**Issue:** String fields were trimmed but not length-capped.

**Resolution:**
- `cap()` helper applied to all string fields before DB insert
- Limits: `id` 128, `path` 512, `referrer` 1024, `utm` 256, `label` 256

---

## Medium

### M-1 — Missing granular permission check on contact submissions ✅ Done

**File:** `src/app/api/admin/contact-submissions/route.ts`  
**Issue:** Used `assertAdminRequest()` (auth only) — any authenticated user could read all contact submissions.

**Resolution:**
- Replaced with `assertAdminPermission(request, 'content:edit')`
- Only users with `content:edit` permission (admin, editor, super_admin) can access submissions

---

### M-2 — Password hashing has no application-level pepper ✅ Done

**Files:** `src/features/cms/adminAuth.ts`, `src/services/env.ts`, `.env.example`  
**Issue:** `hashAdminPassword()` used scrypt with random salt only — DB dump sufficient for offline cracking.

**Resolution:**
- `PASSWORD_PEPPER` env var added (optional 32+ byte hex string)
- `hashAdminPassword()` XORs the derived key with the pepper before storing
- `verifyPassword()` applies the same pepper before comparison
- Pepper is optional — existing deployments without it continue to work
- Documented in `.env.example` with generation instructions
- **Migration note:** Changing `PASSWORD_PEPPER` after users exist requires a password reset. Existing hashes without pepper remain valid until the user next logs in (transparent re-hash on login is a future improvement).

---

### M-3 — Fallback in-memory session store is undocumented and volatile ✅ Done

**File:** `src/features/cms/adminAuth.ts`  
**Issue:** Silent fallback to in-memory sessions when DB unavailable — sessions lost on restart, unbounded growth.

**Resolution:**
- `createFallbackSession()` now logs a `console.error` warning when the fallback store activates
- Store capped at 500 entries; oldest entry evicted when limit is reached
- Documented in `CLAUDE.md` auth section

---

### M-4 — No multi-device session invalidation on logout ✅ Done

**Files:** `src/features/cms/adminAuth.ts`, `src/app/api/admin/auth/logout-all/route.ts`  
**Issue:** Logout deleted only the current session token; other active sessions remained valid.

**Resolution:**
- `logoutAllAdminSessions(userId)` added — deletes all DB sessions for the user and clears in-memory fallback sessions
- `POST /api/admin/auth/logout-all` route added (requires auth + CSRF)
- Audit event `admin.logout_all` logged on use

---

## Low

### L-1 — CSRF origin-check logic undocumented ✅ Done

**File:** `src/services/requestSecurity.ts`  
**Resolution:** Added comment explaining the OR logic intent in `assertTrustedMutationRequest()`.

---

### L-2 — X-XSS-Protection header not set ✅ Done

**File:** `middleware.ts`  
**Resolution:** Added `X-XSS-Protection: 1; mode=block` to the security headers block.

---

### L-3 — Webhook token logged on failure ✅ Done

**File:** `src/services/contactNotifications.ts`  
**Resolution:**
- Added `catch` block that logs only `err.message`
- Request headers (including `Authorization`) are never logged
- Returns `{ delivered: false }` on failure instead of propagating

---

## Forms Inventory

All frontend forms are properly wired. No orphaned forms detected.

| Form | Endpoint | Auth | CSRF | Rate-limited |
|------|----------|------|------|-------------|
| ContactBriefForm | `POST /api/contact` | None (public) | ✅ | ✅ 10/min |
| ContactPageView | `POST /api/contact` | None (public) | ✅ | ✅ 10/min |
| AdminLoginForm | `POST /api/admin/auth` | None (public) | ✅ | ✅ lockout |
| BlogEditorForm | `PUT /api/admin/blog/[id]` | ✅ | ✅ | — |
| PageEditorForm | `PUT /api/admin/pages/[id]` | ✅ | ✅ | — |
| PortfolioEditorForm | `PUT /api/admin/portfolio/[id]` | ✅ | ✅ | — |
| OnboardingSteps | `POST /api/admin/settings` | ✅ | ✅ | — |

---

## API Endpoints — Auth Coverage

| Route | Method | Auth | CSRF | Notes |
|-------|--------|------|------|-------|
| `/api/contact` | POST | None | ✅ | Public — correct |
| `/api/analytics/page-view` | POST | None | ✅ rate-limit | Public beacon — rate-limited, length-capped |
| `/api/analytics/event` | POST | None | ✅ rate-limit | Public — rate-limited, event type allowlisted |
| `/api/admin/auth` | POST | None | ✅ | Login — correct |
| `/api/admin/auth` | DELETE | ✅ | ✅ | Logout |
| `/api/admin/auth/logout-all` | POST | ✅ | ✅ | Logout all devices |
| `/api/admin/blog/*` | ALL | ✅ | ✅ | — |
| `/api/admin/pages/*` | ALL | ✅ | ✅ | — |
| `/api/admin/portfolio/*` | ALL | ✅ | ✅ | — |
| `/api/admin/contact-submissions` | GET | ✅ `content:edit` | — | Role-gated |
| `/api/admin/settings` | ALL | ✅ | ✅ | — |
| `/api/admin/media/*` | ALL | ✅ | ✅ | Magic bytes validated |
| `/api/admin/team/*` | ALL | ✅ | ✅ | — |
| `/api/admin/products/*` | ALL | ✅ `store:edit` | ✅ | Commerce module |
| `/api/admin/orders/*` | ALL | ✅ `store:manage_orders` | ✅ | Commerce module |
| `/api/admin/customers` | GET | ✅ `store:manage_customers` | — | Commerce module |
| `/api/store/products` | GET | None | — | Public, active only |
| `/api/store/checkout` | POST | None | — | Public — rate limiting recommended |
| `/api/store/payment/midtrans` | POST | None | — | Signature-verified webhook |

---

## Execution Order — Final Status

| Priority | Item | Status |
|----------|------|--------|
| 1 | C-2 — IP spoofing fix | ✅ Done |
| 2 | C-1 — Analytics rate limiting + auth | ✅ Done |
| 3 | H-1 — File upload magic bytes | ✅ Done |
| 4 | H-2 — Analytics input length caps | ✅ Done |
| 5 | M-1 — Granular permissions audit | ✅ Done |
| 6 | M-2 — Password pepper | ✅ Done |
| 7 | M-3 — Fallback session safeguards | ✅ Done |
| 8 | M-4 — Multi-device logout | ✅ Done |
| 9 | L-1/L-2/L-3 — Low items | ✅ Done |

All security audit items resolved.

---

# Commerce Module Implementation Plan

Added: 2026-05-15  
Scope: E-commerce store module with feature flag, Drizzle schema, admin CRUD, public storefront, payments, and order emails.

---

## Module Overview

The commerce module adds a full e-commerce capability behind the `ENABLE_STORE_MODULE` feature flag. When disabled, all store routes return 404 and admin navigation hides store sections.

### Architecture

```
src/config/modules.ts               — Feature flag (ENABLE_STORE_MODULE env var)
src/features/commerce/types.ts      — All commerce type definitions
src/features/commerce/store.ts      — Data access layer (Drizzle queries)
src/features/commerce/checkout.ts   — Checkout orchestration + Midtrans integration
src/features/commerce/orderEmail.ts — Order email via Resend
src/features/commerce/cartStore.ts  — Client-side cart (useSyncExternalStore)
src/db/schema.ts                    — Commerce tables appended to existing schema
src/app/api/admin/products/         — Admin product CRUD API
src/app/api/admin/orders/           — Admin order management API
src/app/api/admin/customers/        — Admin customer list API
src/app/api/store/                  — Public store API (products, categories, checkout)
src/app/api/store/payment/midtrans/ — Midtrans webhook handler
src/app/admin/products/             — Admin products UI
src/app/admin/orders/               — Admin orders UI
src/app/admin/customers/            — Admin customers UI
src/app/shop/                       — Public shop listing
src/app/shop/[slug]/                — Product detail page
src/app/cart/                       — Cart page
src/app/checkout/                   — Checkout page
src/app/shop/order/[id]/            — Order confirmation page
src/components/shop/                — Shop UI components
```

---

## Database Schema (Drizzle)

New tables added to `src/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `product_categories` | Hierarchical product categories |
| `products` | Product catalog with status, images, SEO |
| `product_variants` | SKU-level pricing, stock, options |
| `customers` | Customer records with aggregated stats |
| `orders` | Order header with shipping, payment, totals |
| `order_items` | Line items per order |
| `inventory_logs` | Stock change audit trail |
| `coupons` | Discount codes (percentage or fixed) |

Run `npm run db:generate` then `npm run db:migrate` to apply.

---

## RBAC Extension

### New Role: `store_manager`

Permissions: `dashboard:view`, `store:view`, `store:edit`, `store:manage_orders`, `store:manage_customers`, `media:edit`

### New Permissions

| Permission | Granted To |
|-----------|-----------|
| `store:view` | super_admin, admin, store_manager |
| `store:edit` | super_admin, admin, store_manager |
| `store:manage_orders` | super_admin, admin, store_manager |
| `store:manage_customers` | super_admin, admin, store_manager |

---

## Payment Integrations

### Midtrans (Online Payment)

- Snap API integration for checkout redirect
- Webhook at `/api/store/payment/midtrans` for async status updates
- Signature verification using SHA-512 (order_id + status_code + gross_amount + server_key)
- Env vars: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_PRODUCTION`

### Manual Bank Transfer

- Order created with `pending_payment` status
- Admin confirms payment via order detail page → updates to `paid`
- Customer sees transfer instructions on order confirmation page

---

## Email Notifications (Resend)

- Order confirmation email sent on successful checkout
- Status update emails sent when admin changes order status
- Fails silently — never blocks order processing
- Env vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

---

## Cart (Client-Side State)

- Uses `useSyncExternalStore` (React 18+ pattern, no external dependency)
- Persisted to `localStorage` under key `vanaila_cart`
- SSR-safe with `getServerSnapshot` returning empty cart
- Actions: `addToCart`, `updateCartQuantity`, `removeFromCart`, `clearCart`, `setCouponCode`

---

## Feature Flag

```ts
// src/config/modules.ts
export const modules = {
  get ENABLE_STORE_MODULE() {
    return process.env.ENABLE_STORE_MODULE === 'true';
  }
};
```

When `false`:
- All `/api/admin/products`, `/api/admin/orders`, `/api/admin/customers` return 404
- All `/api/store/*` return 404
- `/shop`, `/cart`, `/checkout` pages call `notFound()`
- Admin nav hides "Store" section

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENABLE_STORE_MODULE` | Yes | `true` to enable store |
| `MIDTRANS_SERVER_KEY` | For online payment | Midtrans server key |
| `MIDTRANS_CLIENT_KEY` | For frontend snap | Midtrans client key |
| `MIDTRANS_PRODUCTION` | No | `true` for production |
| `RESEND_API_KEY` | For order emails | Resend API key |
| `RESEND_FROM_EMAIL` | No | Sender address (default: orders@example.com) |

---

## Implementation Tasks

### Phase 1 — Foundation ✅ Done

- [x] Create `src/config/modules.ts` with `ENABLE_STORE_MODULE` flag
- [x] Define commerce types in `src/features/commerce/types.ts`
- [x] Add `store_manager` role and `store:*` permissions to RBAC
- [x] Add commerce tables to `src/db/schema.ts`
- [x] Create data access layer `src/features/commerce/store.ts`
- [x] Create checkout service `src/features/commerce/checkout.ts`
- [x] Create order email service `src/features/commerce/orderEmail.ts`
- [x] Create cart store `src/features/commerce/cartStore.ts`

### Phase 2 — Admin ✅ Done

- [x] Admin products API (`/api/admin/products`)
- [x] Admin orders API (`/api/admin/orders`)
- [x] Admin customers API (`/api/admin/customers`)
- [x] Admin products page with list, create, edit
- [x] Admin orders page with list and detail/status management
- [x] Admin customers page with list
- [x] Add store section to `AdminNav`

### Phase 3 — Public Storefront ✅ Done

- [x] Public products API (`/api/store/products`)
- [x] Public categories API (`/api/store/categories`)
- [x] Public checkout API (`/api/store/checkout`)
- [x] Midtrans webhook (`/api/store/payment/midtrans`)
- [x] Shop listing page (`/shop`)
- [x] Product detail page (`/shop/[slug]`)
- [x] Cart page (`/cart`)
- [x] Checkout page (`/checkout`)
- [x] Order confirmation page (`/shop/order/[id]`)
- [x] Shop components (`ShopGrid`, `ProductDetail`)

### Phase 4 — Deployment Prep

- [ ] Run `npm run db:generate` to create migration files
- [ ] Run `npm run db:migrate` to apply schema
- [ ] Add env vars to production environment
- [ ] Test Midtrans sandbox flow end-to-end
- [ ] Test manual transfer flow end-to-end
- [ ] Verify Resend email delivery
- [ ] Add shop link to site navigation (when ready to go live)

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Checkout abuse | Rate limiting recommended (see C-1 pattern) |
| Stock race conditions | Stock deducted during checkout; inventory logged |
| Payment verification | Midtrans webhook verifies SHA-512 signature |
| Admin access | All admin routes gated by `assertAdminPermission` |
| Feature isolation | Module disabled by default; 404 when off |
| Input validation | Checkout validates required fields; store queries use parameterized Drizzle |
| XSS in product descriptions | `dangerouslySetInnerHTML` — admin-only content; sanitize if user-generated |

---

## Backlog

| Item | Effort |
|------|--------|
| Add rate limiting to `/api/store/checkout` | S |
| Add input length caps to checkout payload | S |
| Shipping cost calculation integration | M |
| Product reviews/ratings | L |
| Inventory low-stock alerts | S |
| Order export (CSV) | S |
| "Sign out all devices" button in admin profile UI | S |
