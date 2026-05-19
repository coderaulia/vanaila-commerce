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
| Customer account dashboard | Done — `/account` links orders, profile, wishlist, own reviews, and shop |
| Customer reviews page/API | Done — `GET /api/account/reviews` and `/account/reviews` show owned submissions |
| Rate limiting on `/api/store/checkout` | Done — 10 req/min |
| Input caps on checkout payload | Done |
| Orders CSV export | Done — `GET /api/admin/orders/export` |
| CMS Settings — Store tab (location, currency, thresholds) | Done |
| CMS Settings — Payments tab (Midtrans toggle, bank details) | Done |
| Checkout payment settings enforcement | Done — disabled CMS payment methods are rejected server-side and hidden client-side |
| Checkout store settings enforcement | Done — minimum order is enforced and free-shipping threshold is applied to quotes/final totals |
| Checkout shipping fallback | Done — RajaOngkir quote flow is used only when configured; manual city/province/postal checkout remains available |
| Order confirmation transfer details | Done — bank details and instructions come from CMS payment settings |
| Low-stock alerts | Done — `GET /api/admin/products/low-stock` and products-page warning banner |
| Deployment env docs | Done — README, env examples, and deployment handoff list store/payment/shipping vars |
| Public shop navigation | Done — default CMS content and local content include `/shop` header/footer links |

---

## Active Priorities

No code priorities remain from this plan.

### Deployment Checklist

- [x] `npm run db:generate` checked migration state. Drizzle only proposed a destructive legacy contact/portfolio table drop migration, so the local generated artifact was removed; review schema history before keeping or applying that migration in production.
- [ ] `npm run db:migrate` still needs a reachable PostgreSQL database. Local run exited non-zero while applying migrations, and Docker access was unavailable in this session.
- [ ] Set production env vars: `ENABLE_STORE_MODULE`, `NEXT_PUBLIC_ENABLE_STORE_MODULE`, `ORDER_RECEIPT_SECRET`, Midtrans keys, Resend key, and optional RajaOngkir shipping vars.
- [ ] Test Midtrans sandbox flow end-to-end with real sandbox credentials.
- [ ] Test manual transfer flow end-to-end with CMS payment settings populated.
- [ ] Verify Resend email delivery with a real sender/domain.

---

## Backlog

No active commerce backlog remains in this plan.
