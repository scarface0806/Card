import { Prisma, PostStatus, type Post } from "@prisma/client";
import prisma from "@/lib/prisma";
import { readingTimeMinutes } from "@/lib/blog/reading-time";
import { htmlToPlainText, sanitizePostHtml } from "@/lib/blog/sanitize";
import type { PostWriteInput } from "@/lib/blog/schemas";
import { slugify, uniqueSlug } from "@/lib/blog/slug";
import type { PostImageData } from "@/lib/blog/types";

/** "" and undefined both mean "no value" on an optional field; store null. */
function orNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Resolve the slug a write should use.
 *
 * The admin may type one; if they leave it blank we derive it from the title.
 * Either way it is made unique against every other post, so two posts can
 * never collide on the URL that identifies them.
 */
export async function resolveSlug(
  desired: string,
  title: string,
  excludePostId?: string
): Promise<string> {
  const seed = slugify(desired) || slugify(title);

  return uniqueSlug(seed, async (candidate) => {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(existing) && existing?.id !== excludePostId;
  });
}

/**
 * Turn a validated request body into the exact fields to write.
 *
 * Three values are computed here and never taken from the client:
 * `content` is sanitized, `readingTimeMinutes` is derived from that sanitized
 * body, and `publishedAt` is stamped the moment a post first goes live.
 */
export function buildPostData(
  input: PostWriteInput,
  slug: string,
  existing?: Post | null
): Prisma.PostUncheckedCreateInput {
  const content = sanitizePostHtml(input.content);
  const status = input.status as PostStatus;

  const explicitPublishedAt = orNull(
    typeof input.publishedAt === "string" ? input.publishedAt : null
  );

  // Publishing with no date given stamps now. An explicit future date is kept
  // as-is, which is what makes scheduling work: the public queries filter on
  // `publishedAt <= now`, so the post simply surfaces when the time comes.
  const publishedAt =
    explicitPublishedAt
      ? new Date(explicitPublishedAt)
      : status === PostStatus.PUBLISHED
        ? (existing?.publishedAt ?? new Date())
        : (existing?.publishedAt ?? null);

  return {
    title: input.title,
    slug,
    excerpt: input.excerpt,
    content,
    coverImage: input.coverImage ?? null,
    galleryImages: input.galleryImages ?? [],
    tags: input.tags ?? [],
    category: orNull(input.category),
    authorName: input.authorName,
    authorAvatar: orNull(input.authorAvatar),
    status,
    publishedAt,
    readingTimeMinutes: readingTimeMinutes(content),
    metaTitle: orNull(input.metaTitle),
    metaDescription: orNull(input.metaDescription) ?? htmlToPlainText(input.excerpt).slice(0, 160),
    ogImage: orNull(input.ogImage),
    canonicalUrl: orNull(input.canonicalUrl),
    noindex: input.noindex,
  };
}

/** Every Cloudinary asset a post owns. */
export function collectPublicIds(post: {
  coverImage: PostImageData | null;
  galleryImages: PostImageData[];
}): string[] {
  const ids = post.galleryImages.map((image) => image.publicId);
  if (post.coverImage?.publicId) ids.push(post.coverImage.publicId);
  return ids.filter(Boolean);
}

/**
 * Assets the previous version owned that the new one does not — a replaced
 * cover, a removed gallery image. Returned so the caller can delete them from
 * Cloudinary instead of leaving them to accumulate as orphans.
 */
export function orphanedPublicIds(
  before: { coverImage: PostImageData | null; galleryImages: PostImageData[] },
  after: { coverImage: PostImageData | null; galleryImages: PostImageData[] }
): string[] {
  const kept = new Set(collectPublicIds(after));
  return collectPublicIds(before).filter((id) => !kept.has(id));
}

/**
 * Record the old slug so the retired URL keeps resolving.
 *
 * Any redirect that pointed AT the new slug is removed first — otherwise
 * renaming `a` -> `b` -> `a` would leave `a` redirecting to itself.
 */
export async function recordSlugChange(postId: string, oldSlug: string, newSlug: string): Promise<void> {
  if (oldSlug === newSlug) return;

  await prisma.postSlugRedirect.deleteMany({ where: { oldSlug: newSlug } });
  await prisma.postSlugRedirect.upsert({
    where: { oldSlug },
    create: { oldSlug, postId },
    update: { postId },
  });
}
