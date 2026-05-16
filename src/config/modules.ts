/**
 * Feature flags for optional modules.
 * Each flag is read from the corresponding env var at runtime.
 * Disabled modules are excluded from navigation, routing, and API responses.
 */

const clean = (value: string | undefined) => value?.trim().replace(/^['"]|['"]$/g, '') || '';

export const modules = {
  /**
   * E-commerce store module: products, orders, customers, inventory.
   * NEXT_PUBLIC_ENABLE_STORE_MODULE is required for client components (AdminNav).
   * ENABLE_STORE_MODULE is the server-only fallback (API routes, server components).
   */
  get ENABLE_STORE_MODULE() {
    const serverValue = clean(process.env.ENABLE_STORE_MODULE);
    const publicValue = clean(process.env.NEXT_PUBLIC_ENABLE_STORE_MODULE);
    const val = serverValue || publicValue;
    return val.toLowerCase() === 'true';
  }
} as const;
