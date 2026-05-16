/**
 * Seed product catalog (categories, products, variants) into the database.
 * Safe to re-run — skips records that already exist (matched by slug/sku).
 *
 * Usage:
 *   npm run db:seed:products
 *   npm run db:seed:products -- --dry-run    # preview without inserting
 *   npm run db:seed:products -- --reset      # delete all commerce data first, then seed
 */

import { randomUUID } from 'node:crypto';

import '../src/services/loadLocalEnv';

import { getDb } from '../src/db/client';
import {
  productCategoriesTable,
  productsTable,
  productVariantsTable
} from '../src/db/schema';

const nowIso = () => new Date().toISOString();
const isDryRun = process.argv.includes('--dry-run');
const isReset = process.argv.includes('--reset');

// ─── Types ───────────────────────────────────────────────────────────────────

type SeedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

type SeedVariant = {
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  options?: Record<string, string>;
  sortOrder?: number;
};

type SeedProduct = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  images: string[];
  featured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  variants: SeedVariant[];
};

// ─── Seed Data ───────────────────────────────────────────────────────────────

const CATEGORIES: SeedCategory[] = [
  { id: randomUUID(), name: 'Tops', slug: 'tops', description: 'T-shirts, hoodies, and sweatshirts', sortOrder: 1 },
  { id: randomUUID(), name: 'Bottoms', slug: 'bottoms', description: 'Pants, shorts, and joggers', sortOrder: 2 },
  { id: randomUUID(), name: 'Outerwear', slug: 'outerwear', description: 'Jackets and windbreakers', sortOrder: 3 },
  { id: randomUUID(), name: 'Accessories', slug: 'accessories', description: 'Hats, bags, and more', sortOrder: 4 }
];

function sizeVariants(skuPrefix: string, price: number, compareAtPrice?: number, stock = 15): SeedVariant[] {
  return ['S', 'M', 'L', 'XL'].map((size, i) => ({
    sku: `${skuPrefix}-${size}`,
    name: size,
    price,
    compareAtPrice,
    stock,
    options: { size },
    sortOrder: i + 1
  }));
}

const PRODUCTS: SeedProduct[] = [
  {
    id: randomUUID(),
    title: 'Heritage Heavyweight Hoodie',
    slug: 'heritage-heavyweight-hoodie',
    shortDescription: 'Crafted from premium 400gsm cotton fleece with signature oversized fit and distressed logo detailing.',
    description: `<p>Our most-loved piece. The Heritage Heavyweight Hoodie is crafted from 400gsm premium cotton fleece — thick enough for Bandung nights, breathable enough for layering year-round.</p>
<ul>
  <li>400gsm cotton fleece</li>
  <li>Oversized relaxed fit</li>
  <li>Distressed logo embroidery at chest</li>
  <li>Double-lined hood with flat drawcords</li>
  <li>Kangaroo pocket with hidden zip</li>
  <li>Ribbed cuffs and hem</li>
</ul>`,
    categorySlug: 'tops',
    images: [],
    featured: true,
    sortOrder: 1,
    seoTitle: 'Heritage Heavyweight Hoodie — Vanaila Store',
    seoDescription: 'Premium 400gsm cotton fleece hoodie. Oversized fit. Born in Bandung.',
    variants: sizeVariants('HOODIE-HERITAGE', 450000, 550000)
  },
  {
    id: randomUUID(),
    title: 'Bandung City Graphic Tee',
    slug: 'bandung-city-graphic-tee',
    shortDescription: 'Lightweight 180gsm tee with hand-drawn Bandung city skyline print on the back.',
    description: `<p>Represent the city. The Bandung City Graphic Tee features a hand-drawn skyline illustration screen-printed on 180gsm ringspun cotton.</p>
<ul>
  <li>180gsm ringspun cotton</li>
  <li>Regular fit</li>
  <li>Hand-drawn Bandung skyline back print</li>
  <li>Minimal logo tonal print at chest</li>
  <li>Pre-washed for softness</li>
</ul>`,
    categorySlug: 'tops',
    images: [],
    featured: false,
    sortOrder: 2,
    variants: sizeVariants('TEE-BANDUNG', 150000, 200000, 25)
  },
  {
    id: randomUUID(),
    title: 'Utility Cargo Pants',
    slug: 'utility-cargo-pants',
    shortDescription: 'Six-pocket cargo pants in heavy-duty ripstop cotton. Adjustable waist, tapered leg.',
    description: `<p>Built for the streets. The Utility Cargo Pants are cut from heavy-duty ripstop cotton in a modern tapered silhouette.</p>
<ul>
  <li>240gsm ripstop cotton</li>
  <li>Tapered leg, relaxed seat</li>
  <li>Six utility pockets</li>
  <li>Adjustable drawstring waist</li>
  <li>YKK zippers throughout</li>
  <li>Available in Olive and Charcoal</li>
</ul>`,
    categorySlug: 'bottoms',
    images: [],
    featured: true,
    sortOrder: 1,
    variants: [
      { sku: 'CARGO-OLIVE-S', name: 'S / Olive', price: 350000, stock: 10, options: { size: 'S', color: 'Olive' }, sortOrder: 1 },
      { sku: 'CARGO-OLIVE-M', name: 'M / Olive', price: 350000, stock: 12, options: { size: 'M', color: 'Olive' }, sortOrder: 2 },
      { sku: 'CARGO-OLIVE-L', name: 'L / Olive', price: 350000, stock: 8, options: { size: 'L', color: 'Olive' }, sortOrder: 3 },
      { sku: 'CARGO-OLIVE-XL', name: 'XL / Olive', price: 350000, stock: 6, options: { size: 'XL', color: 'Olive' }, sortOrder: 4 },
      { sku: 'CARGO-CHAR-S', name: 'S / Charcoal', price: 350000, stock: 10, options: { size: 'S', color: 'Charcoal' }, sortOrder: 5 },
      { sku: 'CARGO-CHAR-M', name: 'M / Charcoal', price: 350000, stock: 12, options: { size: 'M', color: 'Charcoal' }, sortOrder: 6 },
      { sku: 'CARGO-CHAR-L', name: 'L / Charcoal', price: 350000, stock: 9, options: { size: 'L', color: 'Charcoal' }, sortOrder: 7 },
      { sku: 'CARGO-CHAR-XL', name: 'XL / Charcoal', price: 350000, stock: 5, options: { size: 'XL', color: 'Charcoal' }, sortOrder: 8 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Vintage Wash Denim Jacket',
    slug: 'vintage-wash-denim-jacket',
    shortDescription: 'Japanese selvedge denim, enzyme-washed for a lived-in look. Boxy cut, raw hem.',
    description: `<p>The piece that finishes every fit. Cut from 12oz Japanese selvedge denim and stone-washed to a perfect faded finish right here in Bandung.</p>
<ul>
  <li>12oz Japanese selvedge denim</li>
  <li>Boxy oversized cut</li>
  <li>Enzyme stone-wash finish</li>
  <li>Raw hem and cuffs</li>
  <li>YKK brass buttons</li>
  <li>Two chest + two side pockets</li>
</ul>`,
    categorySlug: 'outerwear',
    images: [],
    featured: false,
    sortOrder: 1,
    variants: sizeVariants('DENIM-JACKET', 420000, undefined, 8)
  },
  {
    id: randomUUID(),
    title: 'Lightweight Windbreaker',
    slug: 'lightweight-windbreaker',
    shortDescription: 'Water-resistant ripstop shell. Packable into its own chest pocket. Minimal logo.',
    description: `<p>New in. The Lightweight Windbreaker is made from a technical water-resistant ripstop shell and packs down into its own chest pocket.</p>
<ul>
  <li>Water-resistant ripstop nylon</li>
  <li>Packable into chest pocket</li>
  <li>Adjustable hem and cuffs</li>
  <li>Mesh-lined for breathability</li>
  <li>Minimal embroidered logo at chest</li>
</ul>`,
    categorySlug: 'outerwear',
    images: [],
    featured: true,
    sortOrder: 2,
    seoTitle: 'Lightweight Windbreaker — New Arrival — Vanaila Store',
    variants: sizeVariants('WINDBREAKER', 280000, undefined, 20)
  },
  {
    id: randomUUID(),
    title: 'Classic Crewneck Sweatshirt',
    slug: 'classic-crewneck-sweatshirt',
    shortDescription: '320gsm fleece-back cotton. Dropped shoulder, slightly oversized. Tonal embroidered logo.',
    description: `<p>The everyday essential. Cut from 320gsm cotton fleece-back jersey, the Classic Crewneck is the piece you reach for every time.</p>
<ul>
  <li>320gsm cotton fleece-back jersey</li>
  <li>Dropped shoulder fit</li>
  <li>Tonal embroidered logo at chest</li>
  <li>Ribbed collar, cuffs, and hem</li>
</ul>`,
    categorySlug: 'tops',
    images: [],
    featured: false,
    sortOrder: 3,
    variants: sizeVariants('CREWNECK-CLASSIC', 320000, 380000, 18)
  },
  {
    id: randomUUID(),
    title: 'Streetwear Bucket Hat',
    slug: 'streetwear-bucket-hat',
    shortDescription: 'Cotton twill bucket hat with woven label. One size fits most.',
    description: `<p>The finishing touch. Cotton twill with a structured brim and woven Vanaila label at the side.</p>
<ul>
  <li>100% cotton twill</li>
  <li>Structured medium brim</li>
  <li>Woven Vanaila label</li>
  <li>One size fits most</li>
</ul>`,
    categorySlug: 'accessories',
    images: [],
    featured: false,
    sortOrder: 1,
    variants: [
      { sku: 'BUCKET-HAT-BLK', name: 'Black', price: 120000, stock: 30, options: { color: 'Black' }, sortOrder: 1 },
      { sku: 'BUCKET-HAT-SAND', name: 'Sand', price: 120000, stock: 25, options: { color: 'Sand' }, sortOrder: 2 },
      { sku: 'BUCKET-HAT-OLIVE', name: 'Olive', price: 120000, stock: 20, options: { color: 'Olive' }, sortOrder: 3 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Canvas Tote Bag',
    slug: 'canvas-tote-bag',
    shortDescription: 'Heavy-duty 12oz canvas tote with inner zip pocket. Screen-printed logo.',
    description: `<p>Carry your whole life in it. 12oz natural canvas with reinforced handles and a hidden zip pocket inside.</p>
<ul>
  <li>12oz natural canvas</li>
  <li>Reinforced 60cm drop handles</li>
  <li>Inner zip pocket</li>
  <li>Screen-printed Vanaila logo</li>
  <li>40 × 38 × 10 cm</li>
</ul>`,
    categorySlug: 'accessories',
    images: [],
    featured: false,
    sortOrder: 2,
    variants: [
      { sku: 'TOTE-NATURAL', name: 'Natural', price: 85000, stock: 50, options: { color: 'Natural' }, sortOrder: 1 },
      { sku: 'TOTE-BLACK', name: 'Black', price: 85000, stock: 40, options: { color: 'Black' }, sortOrder: 2 }
    ]
  }
];

// ─── Main ────────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(msg); }

async function main() {
  const db = getDb();
  const now = nowIso();

  if (isReset) {
    if (isDryRun) {
      log('[dry-run] Would delete all product variants, products, and product categories.');
    } else {
      log('Resetting commerce product data...');
      await db.delete(productVariantsTable);
      await db.delete(productsTable);
      await db.delete(productCategoriesTable);
      log('  ✓ Cleared product_variants, products, product_categories');
    }
  }

  const existingCategories = await db.select({ slug: productCategoriesTable.slug }).from(productCategoriesTable);
  const existingCategorySlugs = new Set(existingCategories.map((r) => r.slug));
  const newCategories = CATEGORIES.filter((c) => !existingCategorySlugs.has(c.slug));

  if (newCategories.length === 0) {
    log('Categories: all already exist, skipping.');
  } else {
    log(`Categories: inserting ${newCategories.length} new...`);
    for (const cat of newCategories) log(`  • ${cat.name}`);
    if (!isDryRun) {
      await db.insert(productCategoriesTable).values(
        newCategories.map((c) => ({ ...c, createdAt: now, updatedAt: now }))
      );
    }
  }

  const allCategories = await db
    .select({ id: productCategoriesTable.id, slug: productCategoriesTable.slug })
    .from(productCategoriesTable);
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  const existingProducts = await db.select({ slug: productsTable.slug }).from(productsTable);
  const existingProductSlugs = new Set(existingProducts.map((r) => r.slug));
  const newProducts = PRODUCTS.filter((p) => !existingProductSlugs.has(p.slug));

  if (newProducts.length === 0) {
    log('Products: all already exist, skipping.');
  } else {
    log(`\nProducts: inserting ${newProducts.length} new...`);
    for (const product of newProducts) {
      const categoryId = categoryIdBySlug.get(product.categorySlug) ?? null;
      log(`  • [${product.variants.length} variants] ${product.title}`);

      if (!isDryRun) {
        await db.insert(productsTable).values({
          id: product.id,
          title: product.title,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          status: 'active',
          categoryId,
          images: product.images,
          featured: product.featured,
          sortOrder: product.sortOrder,
          seoTitle: product.seoTitle ?? product.title,
          seoDescription: product.seoDescription ?? product.shortDescription,
          createdAt: now,
          updatedAt: now
        });

        const existingVariants = await db
          .select({ sku: productVariantsTable.sku })
          .from(productVariantsTable);
        const existingSkus = new Set(existingVariants.map((r) => r.sku));
        const newVariants = product.variants.filter((v) => !existingSkus.has(v.sku));

        if (newVariants.length > 0) {
          await db.insert(productVariantsTable).values(
            newVariants.map((v) => ({
              id: randomUUID(),
              productId: product.id,
              sku: v.sku,
              name: v.name,
              price: String(v.price),
              compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : null,
              stock: v.stock,
              weight: null,
              options: v.options ?? {},
              sortOrder: v.sortOrder ?? 0,
              createdAt: now,
              updatedAt: now
            }))
          );
        }
      }
    }
  }

  if (isDryRun) {
    log('\n[dry-run] No changes made to the database.');
  } else {
    const [catCount, prodCount, varCount] = await Promise.all([
      db.select().from(productCategoriesTable),
      db.select().from(productsTable),
      db.select().from(productVariantsTable)
    ]);
    log(`\n✓ Done. Database now has:`);
    log(`  ${catCount.length} product categories`);
    log(`  ${prodCount.length} products`);
    log(`  ${varCount.length} product variants`);
  }
}

main().catch((err) => {
  console.error('Error seeding products:', err);
  process.exit(1);
});
