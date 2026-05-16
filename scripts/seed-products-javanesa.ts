/**
 * Seed organic skincare catalog for the Javanesa homepage template.
 * Categories and products are themed around Javanese / Yogyakarta beauty rituals.
 * Product images use Unsplash (stable photo IDs, no API key required).
 *
 * Usage:
 *   npm run db:seed:javanesa
 *   npm run db:seed:javanesa -- --dry-run   # preview without inserting
 *   npm run db:seed:javanesa -- --reset     # clear commerce data first, then seed
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

const unsplash = (id: string, w = 600, h = 750) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

// ─── Seed Data ───────────────────────────────────────────────────────────────

type SeedCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
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

const CATEGORIES: SeedCategory[] = [
  {
    id: randomUUID(),
    name: 'Bio-Herbal',
    slug: 'bio-herbal',
    description: 'Botanical extracts and traditional Javanese herbal formulas',
    image: unsplash('1465146344425-f00d5f5ecc7e', 400, 500),
    sortOrder: 1
  },
  {
    id: randomUUID(),
    name: 'Body Care',
    slug: 'body-care',
    description: 'Scrubs, lotions, and oils for full-body rituals',
    image: unsplash('1570194065650-d99fb4bedf0a', 400, 500),
    sortOrder: 2
  },
  {
    id: randomUUID(),
    name: 'Aromatherapy',
    slug: 'aromatherapy',
    description: 'Floral mists, candles, and soothing bath soaks',
    image: unsplash('1503944168849-8bf86e9044c7', 400, 500),
    sortOrder: 3
  },
  {
    id: randomUUID(),
    name: 'Skin Care',
    slug: 'skin-care',
    description: 'Serums, tonics, and elixirs rooted in royal Yogyakarta traditions',
    image: unsplash('1596755389378-c31d21fd1273', 400, 500),
    sortOrder: 4
  }
];

const PRODUCTS: SeedProduct[] = [
  {
    id: randomUUID(),
    title: 'Lulur Kuning Body Scrub',
    slug: 'lulur-kuning-body-scrub',
    shortDescription:
      'Traditional Javanese bridal scrub with turmeric, rice flour, and jasmine. Polishes and brightens in one ritual.',
    description: `<p>The <em>lulur</em> body scrub is a centuries-old Kraton bridal ritual from Yogyakarta. Our Lulur Kuning stays true to the original — turmeric, white rice flour, frangipani, and a touch of sandalwood, blended into a creamy paste that buffs away dead skin and leaves a warm glow.</p>
<ul>
  <li>Key ingredients: turmeric, rice flour, frangipani, sandalwood</li>
  <li>Apply to damp skin, massage in circles, rinse</li>
  <li>150 g jar — 8 to 10 uses</li>
  <li>No parabens, no sulfates, no synthetic fragrance</li>
</ul>`,
    categorySlug: 'body-care',
    images: [
      unsplash('1608248543803-ba4f8c70ae0b'),
      unsplash('1571781926291-c69df9975551')
    ],
    featured: true,
    sortOrder: 1,
    seoTitle: 'Lulur Kuning Body Scrub — Javanesa',
    seoDescription:
      'Traditional Javanese bridal scrub with turmeric and jasmine. 150 g. No parabens.',
    variants: [
      { sku: 'LULUR-150G', name: '150 g', price: 350000, compareAtPrice: 450000, stock: 40, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Merapi Volcanic Clay Mask',
    slug: 'merapi-volcanic-clay-mask',
    shortDescription:
      'Deep-cleansing kaolin clay enriched with volcanic mineral ash from Mount Merapi. Draws out impurities without stripping.',
    description: `<p>Mount Merapi's volcanic soil is uniquely rich in silica, calcium, and potassium. We combine locally sourced kaolin clay with a micro-dose of mineral ash to create a mask that deep-cleans pores, controls sebum, and refines texture — in just 10 minutes.</p>
<ul>
  <li>Key ingredients: kaolin clay, volcanic mineral ash, aloe vera, green tea extract</li>
  <li>Apply thin layer, leave 8–12 min, rinse with warm water</li>
  <li>60 g — approximately 12 uses</li>
  <li>Suitable for normal to oily skin</li>
</ul>`,
    categorySlug: 'skin-care',
    images: [unsplash('1556228578-8c89e6adf883')],
    featured: true,
    sortOrder: 2,
    variants: [
      { sku: 'MERAPI-MASK-60G', name: '60 g', price: 280000, stock: 60, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Taman Sari Jasmine Face Mist',
    slug: 'taman-sari-jasmine-face-mist',
    shortDescription:
      'Hydrating face mist distilled from Javanese jasmine (melati) and rose petals. Refreshes and sets makeup.',
    description: `<p>Named after the royal water garden of the Yogyakarta Sultanate, our Taman Sari Face Mist is a light, fragrant hydration boost you can use any time. Jasmine hydrosol and rose water calm redness; hyaluronic acid locks in moisture.</p>
<ul>
  <li>Key ingredients: jasmine hydrosol, rose water, hyaluronic acid, vitamin B5</li>
  <li>Mist from 20–30 cm, eyes closed</li>
  <li>100 ml glass bottle</li>
  <li>Alcohol-free, suitable for all skin types</li>
</ul>`,
    categorySlug: 'aromatherapy',
    images: [unsplash('1571781926291-c69df9975551')],
    featured: true,
    sortOrder: 3,
    variants: [
      { sku: 'MIST-JASMINE-100ML', name: '100 ml', price: 420000, stock: 35, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Temulawak Brightening Serum',
    slug: 'temulawak-brightening-serum',
    shortDescription:
      'Potent vitamin C serum amplified with temulawak (Javanese ginger) extract. Fades dark spots, boosts radiance.',
    description: `<p><em>Temulawak</em> (Curcuma xanthorrhiza) has been used in Javanese jamu for centuries to brighten skin from within. Paired with 10% stable vitamin C and niacinamide, this serum visibly reduces hyperpigmentation in 4 weeks.</p>
<ul>
  <li>Key ingredients: temulawak extract, 10% ascorbic acid, niacinamide, peptides</li>
  <li>Apply 3–4 drops to clean skin, morning and evening</li>
  <li>30 ml amber dropper bottle</li>
  <li>Dermatologist tested</li>
</ul>`,
    categorySlug: 'skin-care',
    images: [unsplash('1512290923902-8a9f81dc236c')],
    featured: true,
    sortOrder: 4,
    seoTitle: 'Temulawak Brightening Serum — Javanesa',
    seoDescription:
      'Vitamin C + temulawak ginger serum. Fades dark spots in 4 weeks. 30 ml.',
    variants: [
      { sku: 'SERUM-TEMULAWAK-30ML', name: '30 ml', price: 550000, compareAtPrice: 650000, stock: 25, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Cendana Sandalwood Face Oil',
    slug: 'cendana-sandalwood-face-oil',
    shortDescription:
      'Lightweight dry oil with East Javanese sandalwood, sea buckthorn, and squalane. Nourishes without greasiness.',
    description: `<p>Sourced from sustainable East Javanese sandalwood plantations, our Cendana Face Oil is a silky dry-touch blend that absorbs in seconds. Sea buckthorn adds beta-carotene for a natural warmth; squalane seals in hydration without clogging pores.</p>
<ul>
  <li>Key ingredients: sandalwood oil, sea buckthorn CO2, squalane, vitamin E</li>
  <li>2–3 drops patted into skin after serum</li>
  <li>30 ml glass dropper — approximately 90 uses</li>
  <li>Non-comedogenic (comedogenic rating 0–1)</li>
</ul>`,
    categorySlug: 'skin-care',
    images: [unsplash('1547592180-85f173990554')],
    featured: false,
    sortOrder: 5,
    variants: [
      { sku: 'OIL-CENDANA-30ML', name: '30 ml', price: 480000, stock: 20, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Pandan Leaf Body Lotion',
    slug: 'pandan-leaf-body-lotion',
    shortDescription:
      'Lightweight everyday lotion with pandan extract and shea butter. Absorbs fast, softens skin all day.',
    description: `<p>Pandan leaf is a staple of Javanese cooking — and its chlorophyll, antioxidants, and fresh green scent translate beautifully into skincare. Our body lotion pairs pandan extract with fair-trade shea butter and aloe for all-day softness without the heavy feel.</p>
<ul>
  <li>Key ingredients: pandan leaf extract, shea butter, aloe vera, ceramides</li>
  <li>Apply generously after shower on damp skin</li>
  <li>200 ml pump bottle</li>
  <li>Vegan, cruelty-free</li>
</ul>`,
    categorySlug: 'body-care',
    images: [unsplash('1570194065650-d99fb4bedf0a')],
    featured: false,
    sortOrder: 6,
    variants: [
      { sku: 'LOTION-PANDAN-200ML', name: '200 ml', price: 220000, stock: 80, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Rempah Ratus Bath Soak',
    slug: 'rempah-ratus-bath-soak',
    shortDescription:
      'Aromatic herbal bath blend of galangal, lemongrass, cloves, and Himalayan salt. Relieves tension, opens the mind.',
    description: `<p><em>Rempah ratus</em> is the ancient Javanese practice of herbal bathing — a ritual of purification before life milestones. Our bath soak brings this tradition home: galangal, lemongrass, and clove release warming aromatic steam while Himalayan pink salt draws out toxins and eases sore muscles.</p>
<ul>
  <li>Key ingredients: galangal, lemongrass, cloves, Himalayan pink salt, kaffir lime peel</li>
  <li>Dissolve 2–3 tablespoons in a warm bath</li>
  <li>250 g resealable pouch — 8 to 10 baths</li>
  <li>100% natural, no additives</li>
</ul>`,
    categorySlug: 'aromatherapy',
    images: [unsplash('1468489273560-b5ddb25f4c78')],
    featured: false,
    sortOrder: 7,
    variants: [
      { sku: 'BATH-REMPAH-250G', name: '250 g', price: 195000, stock: 50, sortOrder: 1 }
    ]
  },
  {
    id: randomUUID(),
    title: 'Java Rosa Water Toner',
    slug: 'java-rosa-water-toner',
    shortDescription:
      'Alcohol-free toner with Javanese rose water, witch hazel, and centella asiatica. Balances and preps skin.',
    description: `<p>Pressed from locally grown Javanese damask roses, our Rosa Water Toner is the essential second step in any skincare ritual. Witch hazel tightens pores without over-drying; centella asiatica soothes redness and supports the skin barrier.</p>
<ul>
  <li>Key ingredients: Javanese rose hydrosol, witch hazel, centella asiatica, panthenol</li>
  <li>Apply with a cotton pad or press into skin with palms</li>
  <li>150 ml glass bottle with pump</li>
  <li>pH balanced (5.0–5.5), alcohol-free</li>
</ul>`,
    categorySlug: 'bio-herbal',
    images: [unsplash('1556228453-efd6c1ff04f6')],
    featured: false,
    sortOrder: 8,
    variants: [
      { sku: 'TONER-ROSA-150ML', name: '150 ml', price: 250000, stock: 45, sortOrder: 1 }
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

  // ── Categories ────────────────────────────────────────────────────────────
  const existingCategories = await db
    .select({ slug: productCategoriesTable.slug })
    .from(productCategoriesTable);
  const existingCategorySlugs = new Set(existingCategories.map((r) => r.slug));
  const newCategories = CATEGORIES.filter((c) => !existingCategorySlugs.has(c.slug));

  if (newCategories.length === 0) {
    log('Categories: all already exist, skipping.');
  } else {
    log(`Categories: inserting ${newCategories.length} new...`);
    for (const cat of newCategories) log(`  • ${cat.name}`);
    if (!isDryRun) {
      await db.insert(productCategoriesTable).values(
        newCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          parentId: null,
          image: c.image,
          sortOrder: c.sortOrder,
          createdAt: now,
          updatedAt: now
        }))
      );
    }
  }

  // ── Products ──────────────────────────────────────────────────────────────
  const allCategories = await db
    .select({ id: productCategoriesTable.id, slug: productCategoriesTable.slug })
    .from(productCategoriesTable);
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  const existingProducts = await db
    .select({ slug: productsTable.slug })
    .from(productsTable);
  const existingProductSlugs = new Set(existingProducts.map((r) => r.slug));
  const newProducts = PRODUCTS.filter((p) => !existingProductSlugs.has(p.slug));

  if (newProducts.length === 0) {
    log('Products: all already exist, skipping.');
  } else {
    log(`\nProducts: inserting ${newProducts.length} new...`);
    for (const product of newProducts) {
      const categoryId = categoryIdBySlug.get(product.categorySlug) ?? null;
      log(`  • [${product.variants.length} variant] ${product.title}`);

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
  console.error('Seed failed:', err);
  process.exit(1);
});
