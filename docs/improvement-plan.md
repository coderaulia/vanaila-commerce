# Commerce Module Improvement Plan

Last audited: 2026-05-18

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

## Priority 3 - Missing Features

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 | Coupon Admin UI | Done | `/admin/coupons` plus `GET/POST /api/admin/coupons` and `PUT/DELETE /api/admin/coupons/[id]` are implemented. |
| 10 | Order Search by Product Name | Done | Admin order search now matches order number, customer name, item product title, variant name, SKU, and current product/variant rows. |
| 11 | Inventory Log Viewer | Done | `/admin/products/[id]/inventory` and `GET /api/admin/products/[id]/inventory` show stock changes, reason, order reference, and variant SKU. |
| 12 | Product Reviews & Ratings | Done | Added `product_reviews`, public review submission, approved reviews on product detail, and `/admin/reviews` moderation. |
| 13 | Wishlist / Save for Later | Done | Client-side wishlist uses `vanaila_wishlist`, heart controls, header count, and `/wishlist` page. |

## Execution Order

1. Complete external production blocker checks in the target environment.
2. Run `npm run check` and `npm run build` after each feature slice.
