import { cache } from "react";
import { Prisma, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import type { AdminListQuery } from "@/lib/blog/schemas";
import {
  toAdminPostRow,
  toPostDetail,
  toPostSummary,
  type AdminPostRow,
  type BlogStats,
  type PostDetail,
  type PostSummary,
  type TopPost,
  type ViewsPoint,
} from "@/lib/blog/types";

/**
 * A post is public only when it is PUBLISHED *and* its publish date has
 * arrived. Scheduling is expressed entirely by this filter — there is no cron
 * job flipping a flag, so a scheduled post simply appears once the clock
 * passes it and the ISR window turns over.
 */
function publicWhere(extra: Prisma.PostWhereInput = {}): Prisma.PostWhereInput {
  return {
    status: PostStatus.PUBLISHED,
    publishedAt: { not: null, lte: new Date() },
    ...extra,
  };
}

const publicOrder: Prisma.PostOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { createdAt: "desc" },
];

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export const listPublishedPosts = cache(
  async ({
    page = 1,
    perPage = 9,
    tag,
  }: { page?: number; perPage?: number; tag?: string } = {}): Promise<{
    posts: PostSummary[];
    total: number;
    totalPages: number;
  }> => {
    const where = publicWhere(tag ? { tags: { has: tag.toLowerCase() } } : {});

    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: publicOrder,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts: rows.map(toPostSummary),
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
);

export const getPublishedPostBySlug = cache(
  async (slug: string): Promise<PostDetail | null> => {
    const post = await prisma.post.findFirst({ where: publicWhere({ slug }) });
    return post ? toPostDetail(post) : null;
  }
);

/**
 * The current slug for a retired one, or null. Drives the 301 that keeps an
 * old URL alive after a slug is edited.
 */
export const resolveSlugRedirect = cache(async (oldSlug: string): Promise<string | null> => {
  const redirect = await prisma.postSlugRedirect.findUnique({ where: { oldSlug } });
  if (!redirect) return null;

  const post = await prisma.post.findFirst({
    where: publicWhere({ id: redirect.postId }),
    select: { slug: true },
  });

  return post?.slug ?? null;
});

/** A draft fetched by id, for the tokenised preview link only. */
export const getPostByIdForPreview = cache(async (id: string): Promise<PostDetail | null> => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;
  const post = await prisma.post.findUnique({ where: { id } });
  return post ? toPostDetail(post) : null;
});

/** Up to `limit` other published posts sharing a tag, newest first. */
export const getRelatedPosts = cache(
  async (postId: string, tags: string[], limit = 3): Promise<PostSummary[]> => {
    if (tags.length === 0) return [];

    const rows = await prisma.post.findMany({
      where: publicWhere({ id: { not: postId }, tags: { hasSome: tags } }),
      orderBy: publicOrder,
      take: limit,
    });

    return rows.map(toPostSummary);
  }
);

/** The posts immediately before and after this one in publish order. */
export const getAdjacentPosts = cache(
  async (
    postId: string,
    publishedAt: string | null
  ): Promise<{ previous: PostSummary | null; next: PostSummary | null }> => {
    if (!publishedAt) return { previous: null, next: null };
    const pivot = new Date(publishedAt);

    const [previous, next] = await Promise.all([
      prisma.post.findFirst({
        where: publicWhere({ id: { not: postId }, publishedAt: { lt: pivot } }),
        orderBy: { publishedAt: "desc" },
      }),
      prisma.post.findFirst({
        where: publicWhere({ id: { not: postId }, publishedAt: { gt: pivot } }),
        orderBy: { publishedAt: "asc" },
      }),
    ]);

    return {
      previous: previous ? toPostSummary(previous) : null,
      next: next ? toPostSummary(next) : null,
    };
  }
);

/** Every tag in use on a published post, with its post count, most used first. */
export const listPublishedTags = cache(
  async (): Promise<{ tag: string; count: number }[]> => {
    const rows = await prisma.post.findMany({
      where: publicWhere(),
      select: { tags: true },
    });

    const counts = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }
);

/** Slug + last-modified for every published post. Feeds the sitemap and RSS. */
export async function listPublishedForFeeds(): Promise<
  { slug: string; title: string; excerpt: string; publishedAt: Date | null; updatedAt: Date }[]
> {
  return prisma.post.findMany({
    where: publicWhere(),
    orderBy: publicOrder,
    select: { slug: true, title: true, excerpt: true, publishedAt: true, updatedAt: true },
  });
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export async function listAdminPosts(
  query: AdminListQuery
): Promise<{ posts: AdminPostRow[]; total: number; totalPages: number }> {
  const where: Prisma.PostWhereInput = {
    ...(query.status !== "ALL" ? { status: query.status as PostStatus } : {}),
    ...(query.tag ? { tags: { has: query.tag.toLowerCase() } } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { slug: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.PostOrderByWithRelationInput =
    query.sort === "views"
      ? { views: "desc" }
      : query.sort === "oldest"
        ? { createdAt: "asc" }
        : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: rows.map(toAdminPostRow),
    total,
    totalPages: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export async function getBlogStats(): Promise<BlogStats> {
  const since = startOfDayUTC(new Date(), -29);

  const [totalPosts, publishedPosts, sums, viewsLast30Days] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.postView.count({ where: { createdAt: { gte: since } } }),
  ]);

  return {
    totalPosts,
    publishedPosts,
    draftPosts: totalPosts - publishedPosts,
    totalViews: sums._sum.views ?? 0,
    viewsLast30Days,
  };
}

export async function getTopPosts(limit = 5): Promise<TopPost[]> {
  return prisma.post.findMany({
    where: { views: { gt: 0 } },
    orderBy: { views: "desc" },
    take: limit,
    select: { id: true, title: true, slug: true, views: true },
  });
}

/**
 * Views per day for the last 30 days, zero-filled so the chart always has 30
 * columns whether or not a day saw traffic.
 *
 * Bucketed in JS rather than by a database aggregation: at blog volumes this
 * is a few thousand rows at most, and it keeps the query inside Prisma rather
 * than dropping to a raw Mongo pipeline for one chart.
 */
export async function getViewsSeries(days = 30): Promise<ViewsPoint[]> {
  const since = startOfDayUTC(new Date(), -(days - 1));

  const rows = await prisma.postView.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + offset);
    buckets.set(dayKey(day), 0);
  }

  for (const row of rows) {
    const key = dayKey(row.createdAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([date, views]) => ({ date, views }));
}

// ---------------------------------------------------------------------------

function startOfDayUTC(from: Date, dayOffset = 0): Date {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
