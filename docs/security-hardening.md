# Security Hardening Notes

## Implemented

- Cookie-based admin sessions with `httpOnly`, `sameSite=lax`, and `secure` in production
- Legacy `x-admin-token` fallback disabled in production
- Same-origin enforcement for state-changing admin requests
- CSRF token validation for cookie-authenticated admin mutations
- Same-origin enforcement for public contact submissions
- Database-backed rate limiting when `DATABASE_URL` is available, with in-memory fallback if the database is unavailable
- Admin login lockout protection
- Server-side audit logging for admin mutations
- Role-based permissions for `super_admin`, `admin`, `editor`, `analyst`, and `store_manager`
- Site-wide security headers via `middleware.ts`
- `no-store` cache policy on sensitive admin/contact responses
- JSON-LD serialization hardened to escape script-breaking characters
- CMS URL validation strips unsafe `javascript:`-style URLs from CTA, canonical, image, and base URLs
- Media deletion protection when an asset is still referenced in content

## Current Baseline Result

- No raw SQL string concatenation in app code; DB access goes through Drizzle
- No browser-storage admin sessions in the production path
- Admin shell remains isolated from the public shell
- Audit trails exist for content, settings, media, auth, and team mutations
- Commerce module gated behind feature flag — zero attack surface when disabled
- Midtrans webhook verifies SHA-512 signature before processing payment status
- Order emails fail silently — never block checkout or order processing

## Still Recommended Before Public Launch

- Add upstream WAF/CDN/rate limiting at the hosting or DNS layer
- Rotate bootstrap admin credentials after first production login
- Restrict database and storage credentials to least privilege
- Add monitoring and alerting for production failures
- Add backup/export procedures for CMS content and media references
- Review production env vars for placeholder values and test credentials

### Commerce Module (when enabled)

- Add rate limiting to `/api/store/checkout` (public endpoint, abuse vector)
- Add input length caps to checkout payload fields
- Verify Midtrans webhook signature validation is working (test with sandbox)
- Ensure `MIDTRANS_SERVER_KEY` is not exposed in client bundles (server-only)
- Consider adding CSRF protection to the checkout endpoint for logged-in users
- Product descriptions use `dangerouslySetInnerHTML` — safe when only admin-authored, but sanitize if user-generated content is ever allowed
- Coupon codes should be rate-limited to prevent brute-force enumeration
- Stock deduction is not wrapped in a database transaction — under extreme concurrency, consider adding `SELECT ... FOR UPDATE` on variant rows

## Operational Note

Application-level protections reduce abuse and brute-force risk. They are not a substitute for upstream network-layer protection.
