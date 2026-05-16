# Implementation Plan

Last updated: 2026-05-16

---

## Security Audit — All Resolved ✅

| Item | Resolution |
|------|-----------|
| C-1 Analytics unprotected | Rate limited 60/min, input capped, event type allowlisted |
| C-2 X-Forwarded-For spoofing | `TRUSTED_PROXY_COUNT` env var; ignores header by default |
| H-1 File upload MIME bypass | Magic byte validation; SVG blocked; 10 MB cap |
| H-2 Analytics no length caps | `cap()` helper on all string fields |
| M-1 Contact submissions ungated | `assertAdminPermission('content:edit')` |
| M-2 No password pepper | `PASSWORD_PEPPER` env var; XOR on derived key |
| M-3 Fallback session volatile | Capped at 500, logs error on activation |
| M-4 No multi-device logout | `logoutAllAdminSessions()` + `POST /api/admin/auth/logout-all` |
| L-1 CSRF logic undocumented | Comment added |
| L-2 X-XSS-Protection missing | Header added in middleware |
| L-3 Webhook token logged | `catch` logs only `err.message` |

---

## Commerce Module

### Completed ✅

| Area | Status |
|------|--------|
| Feature flag (`ENABLE_STORE_MODULE`) | Done — reads `NEXT_PUBLIC_` for client components |
| DB schema (8 tables) | Done |
| Data access layer (`store.ts`) | Done |
| Checkout service + Midtrans | Done |
| Order emails (Resend) | Done |
| Cart (useSyncExternalStore) | Done |
| Admin products CRUD API + UI | Done |
| Admin orders API + UI | Done |
| Admin customers API + UI | Done |
| Admin nav Store section | Done — fixed `NEXT_PUBLIC_ENABLE_STORE_MODULE` |
| Public store API (products, categories, checkout) | Done |
| Midtrans webhook (SHA-512 verified) | Done |
| Public shop pages (listing, detail, cart, checkout, order confirmation) | Done |
| Rate limiting on `/api/store/checkout` | Done — 10 req/min |
| Input caps on checkout payload | Done |
| Orders CSV export | Done — `GET /api/admin/orders/export` |
| CMS Settings — Store tab (location, currency, thresholds) | Done |
| CMS Settings — Payments tab (Midtrans toggle, bank details) | Done |

---

## Active Priorities

### P-1 — Wire CMS payment settings to checkout (Critical gap)

**Problem:** `PaymentSettings.midtransEnabled` and `manualTransferEnabled` stored in CMS but checkout flow ignores them. Users can submit any payment method regardless of what admin configured. Bank transfer details from settings not shown on order confirmation.

**Scope:**
- `src/app/api/store/checkout/route.ts` — read settings, reject disabled payment methods
- `src/features/commerce/checkout.ts` — pass bank details into order / email
- `src/app/shop/order/[id]/page.tsx` — show bank name/account/instructions from settings (not hardcoded)
- `src/app/checkout/page.tsx` — only show enabled payment method options

### P-2 — Wire store settings to checkout validation

**Problem:** `minOrderAmount` and `freeShippingThreshold` in CMS settings do nothing.

**Scope:**
- `src/app/api/store/checkout/route.ts` — enforce min order; apply free shipping when threshold met
- `src/app/checkout/page.tsx` — show free shipping badge when cart qualifies

### P-3 — Commit unstaged checkout/cart refactor

Unstaged: `checkout.ts`, `checkout/route.ts`, `cartStore.ts`, `cart/page.tsx`, `checkout/page.tsx`, `ProductDetail.tsx`, `ShopHero.tsx`, `orderEmail.ts`, `CartPageClient.tsx`, `CheckoutPageClient.tsx`.

Review and commit before P-1/P-2 to avoid conflicts.

### P-4 — Inventory low-stock alerts

**Scope:**
- `GET /api/admin/products/low-stock` — variants where `stock <= threshold` (default 5)
- Dashboard widget or products page badge showing low-stock count
- Optional: `LOW_STOCK_THRESHOLD` env var

### P-5 — Deployment prep

- [ ] `npm run db:generate` → create migration files
- [ ] `npm run db:migrate` → apply schema
- [ ] Set env vars in production (`ENABLE_STORE_MODULE`, `NEXT_PUBLIC_ENABLE_STORE_MODULE`, Midtrans keys, Resend key)
- [ ] Test Midtrans sandbox flow end-to-end
- [ ] Test manual transfer flow end-to-end
- [ ] Verify Resend email delivery
- [ ] Add shop link to site navigation

---

## Backlog

| Item | Effort |
|------|--------|
| Shipping cost calculation integration | M |
| Inventory low-stock alerts | S |
| Product reviews/ratings | L |
