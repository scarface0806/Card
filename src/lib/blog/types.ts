import type { Post, PostStatus } from "@prisma/client";

export type { PostStatus };

/** A Cloudinary image as stored on a post. */
export type PostImageData = {
  url: string;
  publicId: string;
  alt: string;
  width: number;
  height: number;
};

/** The shape the public listing and card components consume. */
export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: PostImageData | null;
  tags: string[];
  category: string | null;
  authorName: string;
  authorAvatar: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number;
  views: number;
};

/** A full post, as the post page consumes it. */
export type PostDetail = PostSummary & {
  content: string;
  galleryImages: PostImageData[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  status: PostStatus;
  updatedAt: string;
};

/** One row of the admin list. */
export type AdminPostRow = PostSummary & {
  status: PostStatus;
  uniqueViews: number;
  updatedAt: string;
};

export type BlogStats = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  viewsLast30Days: number;
};

export type ViewsPoint = { date: string; views: number };

export type TopPost = { id: string; title: string; slug: string; views: number };

/**
 * Narrow a Prisma `Post` down to the summary shape. Kept in one place so no
 * route can accidentally leak a draft's body or its SEO overrides into a
 * public payload.
 */
export function toPostSummary(post: Post): PostSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage ?? null,
    tags: post.tags,
    category: post.category,
    authorName: post.authorName,
    authorAvatar: post.authorAvatar,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    readingTimeMinutes: post.readingTimeMinutes,
    views: post.views,
  };
}

export function toPostDetail(post: Post): PostDetail {
  return {
    ...toPostSummary(post),
    content: post.content,
    galleryImages: post.galleryImages,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogImage: post.ogImage,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
    status: post.status,
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function toAdminPostRow(post: Post): AdminPostRow {
  return {
    ...toPostSummary(post),
    status: post.status,
    uniqueViews: post.uniqueViews,
    updatedAt: post.updatedAt.toISOString(),
  };
}
