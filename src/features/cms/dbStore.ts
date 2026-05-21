import { eq, sql } from 'drizzle-orm';

import { getDb } from '@/db/client';
import {
  blogPostsTable,
  categoriesTable,
  mediaAssetsTable,
  pagesTable,
  postCategoriesTable,
  siteSettingsTable
} from '@/db/schema';

import { getDefaultContent } from './defaultContent';
import {
  deleteBlogPostCategoryLinks,
  mapBlogPostCategorySlugs,
  syncBlogPostCategoryLinks
} from './dbTaxonomy';
import type {
  BlogPost,
  CmsContent,
  LandingPage,
  PageId,
  SiteSettings
} from './types';
import type { BlogQueryInput } from './storeTypes';
import { isBlogPostLive } from './publicationState';
import {
  mergeWithDefaults,
  normalizePageForWrite,
  normalizeSettings,
  normalizeSlug,
  nowIso,
  uniquePostSlug
} from './storeShared';

let bootstrapPromise: Promise<void> | null = null;
let warnedMissingScheduleColumns = false;
let warnedSkippedBuildBootstrap = false;

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { code?: unknown; cause?: unknown };
  if (typeof record.code === 'string') return record.code;
  if (record.cause) return extractErrorCode(record.cause);
  return undefined;
}

function isMissingColumnError(error: unknown) {
  return extractErrorCode(error) === '42703';
}

function warnMissingScheduleColumns() {
  if (warnedMissingScheduleColumns) return;
  warnedMissingScheduleColumns = true;
  console.warn('Scheduled publish columns are not available yet; falling back to legacy content queries.');
}

function isBuildPhase() {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build'
  );
}

function warnSkippedBuildBootstrap() {
  if (warnedSkippedBuildBootstrap) return;
  warnedSkippedBuildBootstrap = true;
  console.warn('Skipping CMS database bootstrap during build; build should not mutate production content.');
}

async function withLegacyScheduleFallback<T>(task: () => Promise<T>, fallbackTask: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (isMissingColumnError(error)) {
      warnMissingScheduleColumns();
      return fallbackTask();
    }
    throw error;
  }
}

type LegacyPageRow = {
  id: PageId;
  title: string;
  navLabel: string;
  slug: string;
  published: boolean;
  seo: LandingPage['seo'];
  sections: LandingPage['sections'];
  homeBlocks: LandingPage['homeBlocks'] | null;
  updatedAt: string;
};

type LegacyPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  coverImage: string;
  status: BlogPost['status'];
  publishedAt: string | null;
  updatedAt: string;
  seo: BlogPost['seo'];
};

function pageToLegacyRow(page: LandingPage) {
  return {
    id: page.id,
    title: page.title,
    navLabel: page.navLabel,
    slug: page.seo.slug,
    published: page.published,
    seo: page.seo,
    sections: page.sections,
    homeBlocks: page.homeBlocks ?? null,
    updatedAt: page.updatedAt
  };
}

function rowToLegacyPage(row: LegacyPageRow): LandingPage {
  return {
    id: row.id,
    title: row.title,
    navLabel: row.navLabel,
    published: row.published,
    scheduledPublishAt: null,
    scheduledUnpublishAt: null,
    seo: {
      ...row.seo,
      slug: row.slug
    },
    sections: row.sections,
    homeBlocks: row.homeBlocks ?? undefined,
    updatedAt: row.updatedAt
  };
}

function postToLegacyRow(post: BlogPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.seo.slug,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    tags: post.tags,
    coverImage: post.coverImage,
    status: post.status,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    seo: post.seo
  };
}

function rowToLegacyPost(row: LegacyPostRow, tags = row.tags): BlogPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    categoryId: null,
    tags,
    coverImage: row.coverImage,
    status: row.status,
    publishedAt: row.publishedAt,
    scheduledPublishAt: null,
    scheduledUnpublishAt: null,
    updatedAt: row.updatedAt,
    seo: {
      ...row.seo,
      slug: row.slug
    }
  };
}

async function readLegacyPages() {
  const result = await getDb().execute<LegacyPageRow>(sql`
    select id, title, nav_label as "navLabel", slug, published, seo, sections, home_blocks as "homeBlocks", updated_at as "updatedAt"
    from pages
  `);
  return result.rows.map(rowToLegacyPage);
}

async function readLegacyPosts() {
  const result = await getDb().execute<LegacyPostRow>(sql`
    select id, title, slug, excerpt, content, author, tags, cover_image as "coverImage", status, published_at as "publishedAt", updated_at as "updatedAt", seo
    from blog_posts
  `);
  const tagMap = await mapBlogPostCategorySlugs(result.rows.map((row) => row.id));
  return result.rows.map((row) => rowToLegacyPost(row, tagMap.get(row.id) ?? row.tags));
}

function pageToRow(page: LandingPage) {
  return {
    id: page.id,
    title: page.title,
    navLabel: page.navLabel,
    slug: page.seo.slug,
    published: page.published,
    scheduledPublishAt: page.scheduledPublishAt ?? null,
    scheduledUnpublishAt: page.scheduledUnpublishAt ?? null,
    seo: page.seo,
    sections: page.sections,
    homeBlocks: page.homeBlocks ?? null,
    updatedAt: page.updatedAt
  };
}

function rowToPage(row: typeof pagesTable.$inferSelect): LandingPage {
  return {
    id: row.id,
    title: row.title,
    navLabel: row.navLabel,
    published: row.published,
    scheduledPublishAt: row.scheduledPublishAt ?? null,
    scheduledUnpublishAt: row.scheduledUnpublishAt ?? null,
    seo: {
      ...row.seo,
      slug: row.slug
    },
    sections: row.sections,
    homeBlocks: row.homeBlocks ?? undefined,
    updatedAt: row.updatedAt
  };
}

function postToRow(post: BlogPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.seo.slug,
    excerpt: post.excerpt,
    content: post.content,
    author: post.author,
    tags: post.tags,
    coverImage: post.coverImage,
    status: post.status,
    publishedAt: post.publishedAt,
    scheduledPublishAt: post.scheduledPublishAt ?? null,
    scheduledUnpublishAt: post.scheduledUnpublishAt ?? null,
    updatedAt: post.updatedAt,
    seo: post.seo
  };
}

function rowToPost(row: typeof blogPostsTable.$inferSelect, tags = row.tags): BlogPost {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    categoryId: null,
    tags,
    coverImage: row.coverImage,
    status: row.status,
    publishedAt: row.publishedAt,
    scheduledPublishAt: row.scheduledPublishAt ?? null,
    scheduledUnpublishAt: row.scheduledUnpublishAt ?? null,
    updatedAt: row.updatedAt,
    seo: {
      ...row.seo,
      slug: row.slug
    }
  };
}

async function ensureDbBootstrap() {
  if (isBuildPhase()) {
    warnSkippedBuildBootstrap();
    return;
  }

  if (bootstrapPromise) {
    await bootstrapPromise;
    return;
  }

  bootstrapPromise = (async () => {
    const db = getDb();

    const existingSettings = await db.select({ id: siteSettingsTable.id }).from(siteSettingsTable).limit(1);
    if (existingSettings.length === 0) {
      await db
        .insert(siteSettingsTable)
        .values({
          id: 'default',
          payload: getDefaultContent().settings,
          updatedAt: nowIso()
        })
        .onConflictDoNothing();
    }

    const existingPages = await db.select({ id: pagesTable.id }).from(pagesTable).limit(1);
    if (existingPages.length === 0) {
      await withLegacyScheduleFallback(
        () => db.insert(pagesTable).values(Object.values(getDefaultContent().pages).map(pageToRow)).onConflictDoNothing(),
        () => db.insert(pagesTable).values(Object.values(getDefaultContent().pages).map(pageToLegacyRow)).onConflictDoNothing()
      );
    }

    const existingPosts = await db.select({ id: blogPostsTable.id }).from(blogPostsTable).limit(1);
    if (existingPosts.length === 0) {
      await withLegacyScheduleFallback(
        () => db.insert(blogPostsTable).values(getDefaultContent().blogPosts.map(postToRow)).onConflictDoNothing(),
        () => db.insert(blogPostsTable).values(getDefaultContent().blogPosts.map(postToLegacyRow)).onConflictDoNothing()
      );
    }

    const existingCategories = await db.select({ id: categoriesTable.id }).from(categoriesTable).limit(1);
    if (existingCategories.length === 0) {
      await db.insert(categoriesTable).values(getDefaultContent().categories).onConflictDoNothing();
    }

    const existingMedia = await db.select({ id: mediaAssetsTable.id }).from(mediaAssetsTable).limit(1);
    if (existingMedia.length === 0) {
      await db.insert(mediaAssetsTable).values(getDefaultContent().mediaAssets).onConflictDoNothing();
    }

    const seededPosts = await withLegacyScheduleFallback(
      () => db.select().from(blogPostsTable).then((rows) => rows.map((row) => rowToPost(row))),
      () => readLegacyPosts()
    );
    await syncBlogPostCategoryLinks(seededPosts);

  })();

  try {
    await bootstrapPromise;
    // Keep the resolved promise — future callers await it instantly, skip re-running
  } catch (error) {
    bootstrapPromise = null; // Reset on error to allow retry
    throw error;
  }
}

async function loadAllPages() {
  return withLegacyScheduleFallback(async () => {
    await ensureDbBootstrap();
    const rows = await getDb().select().from(pagesTable);
    return rows.map(rowToPage);
  }, async () => {
    await ensureDbBootstrap();
    return readLegacyPages();
  });
}

async function loadAllPosts() {
  return withLegacyScheduleFallback(async () => {
    await ensureDbBootstrap();
    const rows = await getDb().select().from(blogPostsTable);
    const tagMap = await mapBlogPostCategorySlugs(rows.map((row) => row.id));
    return rows.map((row) => rowToPost(row, tagMap.get(row.id) ?? row.tags));
  }, async () => {
    await ensureDbBootstrap();
    return readLegacyPosts();
  });
}

export async function replaceAllCmsContent(content: CmsContent) {
  const db = getDb();
  const normalized = mergeWithDefaults(content);

  await db.transaction(async (tx) => {
    await tx.delete(postCategoriesTable);
    await tx.delete(blogPostsTable);
    await tx.delete(categoriesTable);
    await tx.delete(mediaAssetsTable);
    await tx.delete(pagesTable);
    await tx.delete(siteSettingsTable);

    await tx.insert(siteSettingsTable).values({
      id: 'default',
      payload: normalizeSettings(normalized.settings),
      updatedAt: nowIso()
    });

    await tx.insert(pagesTable).values(Object.values(normalized.pages).map(pageToRow));
    await tx.insert(categoriesTable).values(normalized.categories);
    await tx.insert(blogPostsTable).values(normalized.blogPosts.map(postToRow));
    await tx.insert(mediaAssetsTable).values(normalized.mediaAssets);
  });

  await syncBlogPostCategoryLinks(normalized.blogPosts);
}

export async function getSettings() {
  await ensureDbBootstrap();
  const row = await getDb().select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 'default')).limit(1);
  return normalizeSettings(row[0]?.payload ?? getDefaultContent().settings);
}

export async function updateSettings(settings: SiteSettings): Promise<SiteSettings> {
  await ensureDbBootstrap();
  const next = normalizeSettings(settings);
  await getDb()
    .insert(siteSettingsTable)
    .values({
      id: 'default',
      payload: next,
      updatedAt: nowIso()
    })
    .onConflictDoUpdate({
      target: siteSettingsTable.id,
      set: {
        payload: next,
        updatedAt: nowIso()
      }
    });

  return next;
}

export async function getPages() {
  const pages = await loadAllPages();
  const next = { ...structuredClone(getDefaultContent().pages) };
  for (const page of pages) {
    next[page.id] = page;
  }
  return next;
}

export async function getPageById(id: PageId): Promise<LandingPage | null> {
  return withLegacyScheduleFallback(async () => {
    await ensureDbBootstrap();
    const row = await getDb().select().from(pagesTable).where(eq(pagesTable.id, id)).limit(1);
    return row[0] ? rowToPage(row[0]) : null;
  }, async () => {
    await ensureDbBootstrap();
    const result = await getDb().execute<LegacyPageRow>(sql`
      select id, title, nav_label as "navLabel", slug, published, seo, sections, home_blocks as "homeBlocks", updated_at as "updatedAt"
      from pages
      where id = ${id}
      limit 1
    `);
    return result.rows[0] ? rowToLegacyPage(result.rows[0]) : null;
  });
}

export async function upsertPage(page: LandingPage): Promise<LandingPage> {
  const pages = await loadAllPages();
  const nextPage = normalizePageForWrite(page, pages);

  await getDb()
    .insert(pagesTable)
    .values(pageToRow(nextPage))
    .onConflictDoUpdate({
      target: pagesTable.id,
      set: pageToRow(nextPage)
    });

  return nextPage;
}

export async function getBlogPosts(includeDrafts = false): Promise<BlogPost[]> {
  const posts = await loadAllPosts();
  const filtered = includeDrafts ? posts : posts.filter((post) => isBlogPostLive(post));
  return filtered.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function queryBlogPosts(input: BlogQueryInput) {
  const posts = await loadAllPosts();
  const query = (input.q ?? '').trim().toLowerCase();
  const category = (input.category ?? '').trim().toLowerCase();
  const status =
    input.status === 'draft' || input.status === 'published' || input.status === 'all'
      ? input.status
      : 'all';
  const dateSort = input.dateSort === 'oldest' ? 'oldest' : 'newest';
  const page = Number.isFinite(input.page) && (input.page ?? 0) > 0 ? Number(input.page) : 1;
  const pageSize =
    Number.isFinite(input.pageSize) && (input.pageSize ?? 0) > 0
      ? Math.min(Number(input.pageSize), 50)
      : 10;

  const categories = Array.from(
    new Set(
      posts
        .flatMap((post) => post.tags)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    )
  ).sort((a, b) => (a > b ? 1 : -1));

  let filtered = posts.filter((post) => {
    if (!input.includeDrafts && !isBlogPostLive(post)) return false;
    if (status !== 'all' && post.status !== status) return false;
    if (query.length > 0) {
      const haystack = `${post.title} ${post.author}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (category.length > 0) {
      const hasCategory = post.tags.some((tag) => tag.toLowerCase() === category);
      if (!hasCategory) return false;
    }
    return true;
  });

  filtered = filtered.sort((a, b) => {
    if (dateSort === 'oldest') return a.updatedAt > b.updatedAt ? 1 : -1;
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return {
    posts: paginated,
    meta: {
      total,
      page,
      pageSize,
      categories
    }
  };
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  return withLegacyScheduleFallback(async () => {
    await ensureDbBootstrap();
    const row = await getDb().select().from(blogPostsTable).where(eq(blogPostsTable.id, id)).limit(1);
    if (!row[0]) return null;
    const tagMap = await mapBlogPostCategorySlugs([id]);
    return rowToPost(row[0], tagMap.get(id) ?? row[0].tags);
  }, async () => {
    await ensureDbBootstrap();
    const result = await getDb().execute<LegacyPostRow>(sql`
      select id, title, slug, excerpt, content, author, tags, cover_image as "coverImage", status, published_at as "publishedAt", updated_at as "updatedAt", seo
      from blog_posts
      where id = ${id}
      limit 1
    `);
    if (!result.rows[0]) return null;
    const tagMap = await mapBlogPostCategorySlugs([id]);
    return rowToLegacyPost(result.rows[0], tagMap.get(id) ?? result.rows[0].tags);
  });
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const normalized = normalizeSlug(slug);
  return withLegacyScheduleFallback(async () => {
    await ensureDbBootstrap();
    const row = await getDb().select().from(blogPostsTable).where(eq(blogPostsTable.slug, normalized)).limit(1);
    if (!row[0]) return null;
    if (!isBlogPostLive(rowToPost(row[0]))) return null;
    const tagMap = await mapBlogPostCategorySlugs([row[0].id]);
    return rowToPost(row[0], tagMap.get(row[0].id) ?? row[0].tags);
  }, async () => {
    await ensureDbBootstrap();
    const result = await getDb().execute<LegacyPostRow>(sql`
      select id, title, slug, excerpt, content, author, tags, cover_image as "coverImage", status, published_at as "publishedAt", updated_at as "updatedAt", seo
      from blog_posts
      where slug = ${normalized}
      limit 1
    `);
    if (!result.rows[0]) return null;
    const tagMap = await mapBlogPostCategorySlugs([result.rows[0].id]);
    return rowToLegacyPost(result.rows[0], tagMap.get(result.rows[0].id) ?? result.rows[0].tags);
  });
}

export async function createBlogPost(payload?: Partial<BlogPost>): Promise<BlogPost> {
  const posts = await loadAllPosts();
  const settings = await getSettings();
  const id = crypto.randomUUID();
  const title = payload?.title?.trim() || 'Untitled post';
  const slug = uniquePostSlug(posts, title, payload?.seo?.slug);
  const writing = settings.writing;
  const requestedStatus = payload?.status;
  const fallbackStatus = writing.requireReviewBeforePublish ? 'draft' : writing.defaultPostStatus;
  const status = requestedStatus ?? fallbackStatus;

  const post: BlogPost = {
    id,
    title,
    excerpt: payload?.excerpt?.trim() || '',
    content: payload?.content || '',
    author: payload?.author?.trim() || writing.defaultPostAuthor || 'Admin',
    categoryId: payload?.categoryId ?? null,
    tags:
      payload?.tags ??
      (writing.defaultPostCategory ? [writing.defaultPostCategory.toLowerCase()] : []),
    coverImage: payload?.coverImage || '',
    status,
    publishedAt: status === 'published' ? nowIso() : null,
    scheduledPublishAt: payload?.scheduledPublishAt ?? null,
    scheduledUnpublishAt: payload?.scheduledUnpublishAt ?? null,
    updatedAt: nowIso(),
    seo: {
      metaTitle: payload?.seo?.metaTitle || title,
      metaDescription: payload?.seo?.metaDescription || '',
      slug,
      canonical: payload?.seo?.canonical || '',
      socialImage: payload?.seo?.socialImage || '',
      noIndex: payload?.seo?.noIndex ?? false,
      keywords: payload?.seo?.keywords ?? []
    }
  };

  await getDb().insert(blogPostsTable).values(postToRow(post));
  await syncBlogPostCategoryLinks([post]);
  return post;
}

export async function updateBlogPost(id: string, payload: BlogPost): Promise<BlogPost | null> {
  const posts = await loadAllPosts();
  const existing = posts.find((p) => p.id === id);
  if (!existing) return null;

  const slug = uniquePostSlug(posts, payload.title, payload.seo.slug, id);
  const next: BlogPost = {
    ...payload,
    id,
    seo: {
      ...payload.seo,
      slug
    },
    publishedAt:
      payload.status === 'published'
        ? existing.publishedAt ?? nowIso()
        : payload.publishedAt ?? null,
    updatedAt: nowIso()
  };

  await getDb().update(blogPostsTable).set(postToRow(next)).where(eq(blogPostsTable.id, id));
  await syncBlogPostCategoryLinks([next]);
  return next;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const existing = await getBlogPostById(id);
  if (!existing) return false;
  await deleteBlogPostCategoryLinks([id]);
  await getDb().delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  return true;
}

export async function setPostStatus(id: string, status: 'draft' | 'published'): Promise<BlogPost | null> {
  const existing = await getBlogPostById(id);
  if (!existing) return null;

  const next: BlogPost = {
    ...existing,
    status,
    publishedAt: status === 'published' ? existing.publishedAt ?? nowIso() : null,
    scheduledPublishAt: status === 'published' ? null : existing.scheduledPublishAt ?? null,
    scheduledUnpublishAt: status === 'draft' ? null : existing.scheduledUnpublishAt ?? null,
    updatedAt: nowIso()
  };

  await getDb().update(blogPostsTable).set(postToRow(next)).where(eq(blogPostsTable.id, id));
  return next;
}
