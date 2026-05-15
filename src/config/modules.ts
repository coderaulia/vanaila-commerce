/**
 * Feature flags for optional modules.
 * Each flag is read from the corresponding env var at runtime.
 * Disabled modules are excluded from navigation, routing, and API responses.
 */

const clean = (value: string | undefined) => value?.trim().replace(/^['"]|['"]$/g, '') || '';

export const modules = {
  /** E-commerce store module: products, orders, customers, inventory */
  get ENABLE_STORE_MODULE() {
    return clean(process.env.ENABLE_STORE_MODULE).toLowerCase() === 'true';
  }
} as const;
