# Commerce Module Improvement Plan

Last audited: 2026-05-20

This plan is ordered by production risk first, then by user-facing commerce gaps. Items marked "External" require real production or sandbox credentials and cannot be completed from the local checkout alone.

## Priority 1 - Production Blockers

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Run `npm run db:migrate` against real Postgres | External | Still needs a reachable production/staging database before release. Prior local migration generation only proposed destructive legacy table drops, so migration SQL must be reviewed before applying. |
| 2 | Midtrans sandbox end-to-end test | External | Requires real sandbox keys and a webhook-reachable environment. |
| 3 | Manual transfer flow test | External | Requires CMS payment settings populated in the target environment; confirm bank details appear on confirmation and receipt pages. |
| 4 | Resend email with real domain | External | Requires verified sender/domain and `RESEND_API_KEY`; test order confirmation and status update delivery. |
| 5 | Set all production env vars | External | Required: `ENABLE_STORE_MODULE`, `NEXT_PUBLIC_ENABLE_STORE_MODULE`, `ORDER_RECEIPT_SECRET`, Midtrans keys, Resend key, and optional RajaOngkir vars. |

## Priority 2 - Security Fixes

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6 | Wrap stock deduction in DB transaction | Done | `processCheckout()` runs checkout, coupon usage, order creation, stock deduction, and inventory logs inside `db.transaction()`. |
| 7 | Rate limit coupon validation | Done | Coupon validation happens inside the rate-limited checkout route; there is no separate public coupon validation endpoint. |
| 8 | Sanitize product description HTML | Done | Product details render through `sanitizeProductDescriptionHtml()` with coverage in `src/tests/productDetailHtml.test.ts`. |
| 15 | Hash customer session tokens before DB storage | Done | `src/features/commerce/customerAuth.ts`. Added `hashSessionToken` (SHA-256); insert hashes token, lookup and delete hash cookie value before querying DB. |
| 16 | Add CSRF / origin check to customer account routes | Done | `src/app/api/account/logout/route.ts`, login, register. Added `assertTrustedMutationRequest(request)` to all three POST handlers. |
| 17 | Fix variant PUT/DELETE IDOR — verify variant belongs to product in URL | Done | `src/features/commerce/store.ts` `updateVariant`/`deleteVariant` now accept optional `ownerProductId`; route passes route `[id]` as the ownership constraint. |
| 18 | Allowlist fields in `updateProduct` — prevent full-body spread into DB | Done | `src/features/commerce/store.ts` `updateProduct` now explicitly picks writable fields instead of spreading `data`. |
| 19 | Hash raw token in fallback in-memory session store | Done | `src/features/cms/adminAuth.ts`. Fallback Map uses `hashSessionToken(rawToken)` as key on set, get, and delete. |
| 20 | Wrap `adjustStock` in a DB transaction | Done | `src/features/commerce/store.ts` `adjustStock` wraps read + update + insert in `db.transaction(async tx => { ... })`. |
| 21 | Validate cart/wishlist items on localStorage hydration | Done | `cartStore.ts` validates `variantId` is non-empty string and clamps `quantity` 1–99. `wishlistStore.ts` validates `productId` is a non-empty string. |

### Low / Info (audit 2026-05-20)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 22 | Midtrans webhook replay deduplication | Done | `src/app/api/store/payment/midtrans/route.ts`. Returns 200 early if `order.paymentStatus !== 'pending'` before processing status changes. |
| 23 | Require `ORDER_RECEIPT_SECRET` env var — stop falling back to DB URL | Done | `src/features/commerce/orderReceipt.ts`. Now requires `ORDER_RECEIPT_SECRET`; logs a loud error and returns empty string (disabling token issuance) if absent. |

## Priority 3 - Missing Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 | Coupon Admin UI | Done | `/admin/coupons` plus `GET/POST /api/admin/coupons` and `PUT/DELETE /api/admin/coupons/[id]` are implemented. |
| 10 | Order Search by Product Name | Done | Admin order search now matches order number, customer name, item product title, variant name, SKU, and current product/variant rows. |
| 11 | Inventory Log Viewer | Done | `/admin/products/[id]/inventory` and `GET /api/admin/products/[id]/inventory` show stock changes, reason, order reference, and variant SKU. |
| 12 | Product Reviews & Ratings | Done | Added `product_reviews`, public review submission, approved reviews on product detail, `/admin/reviews` moderation, and customer-owned review history at `/account/reviews`. |
| 13 | Wishlist / Save for Later | Done | Client-side wishlist uses `vanaila_wishlist`, heart controls, header count, `/wishlist` page, and account dashboard shortcut. |
| 14 | Customer Account Navigation | Done | `/account` links to profile, orders, wishlist, own reviews, and shop with template-aware button/card styling. |

## Execution Order

1. Complete external production blocker checks in the target environment.
2. Run `npm run check` and `npm run build` after each feature slice.
