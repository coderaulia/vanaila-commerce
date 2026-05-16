import { inArray } from 'drizzle-orm';

import { getDb } from '@/db/client';
import {
  categoriesTable,
  postCategoriesTable
} from '@/db/schema';

import { normalizeCategoryRecord } from './collectionShared';
import { nowIso, normalizeSlug } from './storeShared';
import type { BlogPost, Category } from './types';

type PostTagShape = Pick<BlogPost, 'id' | 'tags'>;

let warnedMissingBlogTaxonomyTables = false;

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { code?: unknown; cause?: unknown };
  if (typeof record.code === 'string') return record.code;
  if (record.cause) return extractErrorCode(record.cause);
  return undefined;
}

function isMissingRelationError(error: unknown) {
  return extractErrorCode(error) === '42P01';
}

function warnMissingBlogTaxonomyTables() {
  if (warnedMissingBlogTaxonomyTables) return;
  warnedMissingBlogTaxonomyTables = true;
  console.warn('Blog taxonomy tables are not available yet; falling back to legacy post tag data.');
}

async function withBlogTaxonomyFallback<T>(task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (isMissingRelationError(error)) {
      warnMissingBlogTaxonomyTables();
      return fallback;
    }
    throw error;
  }
}

function slugToName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function uniqueCategorySlugs(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => normalizeSlug(tag)).filter(Boolean)));
}

async function readCategoriesBySlug(slugs: string[]) {
  if (slugs.length === 0) {
    return [] as Array<typeof categoriesTable.$inferSelect>;
  }

  return getDb().select().from(categoriesTable).where(inArray(categoriesTable.slug, slugs));
}

async function ensureCategoriesForPosts(posts: PostTagShape[]) {
  const requestedSlugs = Array.from(new Set(posts.flatMap((post) => uniqueCategorySlugs(post.tags))));
  if (requestedSlugs.length === 0) {
    return new Map<string, Category>();
  }

  const existingRows = await readCategoriesBySlug(requestedSlugs);
  const categoriesBySlug = new Map(
    existingRows.map((row) => [
      row.slug,
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      } satisfies Category
    ])
  );

  const missing = requestedSlugs
    .filter((slug) => !categoriesBySlug.has(slug))
    .map((slug) =>
      normalizeCategoryRecord({
        id: `category-${slug}`,
        name: slugToName(slug),
        slug,
        description: ''
      })
    );

  if (missing.length > 0) {
    await getDb().insert(categoriesTable).values(missing).onConflictDoNothing();
    for (const category of missing) {
      categoriesBySlug.set(category.slug, category);
    }
  }

  return categoriesBySlug;
}

export async function syncBlogPostCategoryLinks(posts: PostTagShape[]) {
  if (posts.length === 0) {
    return;
  }

  await withBlogTaxonomyFallback(async () => {
    const categoriesBySlug = await ensureCategoriesForPosts(posts);
    const postIds = posts.map((post) => post.id);

    await getDb().delete(postCategoriesTable).where(inArray(postCategoriesTable.postId, postIds));

    const rows = posts.flatMap((post) =>
      uniqueCategorySlugs(post.tags)
        .map((slug) => categoriesBySlug.get(slug))
        .filter((category): category is Category => Boolean(category))
        .map((category) => ({
          postId: post.id,
          categoryId: category.id,
          createdAt: nowIso()
        }))
    );

    if (rows.length > 0) {
      await getDb().insert(postCategoriesTable).values(rows).onConflictDoNothing();
    }
  }, undefined);
}

export async function deleteBlogPostCategoryLinks(postIds: string[]) {
  if (postIds.length === 0) {
    return;
  }

  await withBlogTaxonomyFallback(
    () => getDb().delete(postCategoriesTable).where(inArray(postCategoriesTable.postId, postIds)),
    undefined
  );
}

export async function mapBlogPostCategorySlugs(postIds: string[]) {
  const byPostId = new Map<string, string[]>();
  if (postIds.length === 0) {
    return byPostId;
  }

  return withBlogTaxonomyFallback(async () => {
    const links = await getDb().select().from(postCategoriesTable).where(inArray(postCategoriesTable.postId, postIds));
    if (links.length === 0) {
      return byPostId;
    }

    const categoryIds = Array.from(new Set(links.map((row) => row.categoryId)));
    const categories = await getDb()
      .select()
      .from(categoriesTable)
      .where(inArray(categoriesTable.id, categoryIds));
    const categoriesById = new Map(categories.map((row) => [row.id, row.slug]));

    for (const link of links) {
      const slug = categoriesById.get(link.categoryId);
      if (!slug) {
        continue;
      }

      const current = byPostId.get(link.postId) ?? [];
      current.push(slug);
      byPostId.set(link.postId, current);
    }

    for (const [postId, slugs] of byPostId.entries()) {
      byPostId.set(postId, Array.from(new Set(slugs)).sort((a, b) => a.localeCompare(b)));
    }

    return byPostId;
  }, byPostId);
}

