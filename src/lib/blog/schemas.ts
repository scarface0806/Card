import { z } from "zod";
import { isValidSlug, MAX_SLUG_LENGTH } from "@/lib/blog/slug";

/** Cloudinary-backed image. Alt text is required, never optional. */
export const postImageSchema = z.object({
  url: z.string().url("Image URL must be a valid URL"),
  publicId: z.string().min(1, "Missing Cloudinary public id"),
  alt: z.string().trim().min(1, "Alt text is required").max(200, "Alt text is too long"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(MAX_SLUG_LENGTH, `Slug cannot exceed ${MAX_SLUG_LENGTH} characters`)
  .refine((value) => value === "" || isValidSlug(value), {
    message: "Slug may only contain lowercase letters, numbers and single hyphens",
  });

const tagsField = z
  .array(z.string().trim().min(1).max(40))
  .max(10, "A post can carry at most 10 tags")
  .transform((tags) => Array.from(new Set(tags.map((tag) => tag.toLowerCase()))));

/**
 * The write payload for a post. `readingTimeMinutes`, `views` and
 * `uniqueViews` are absent by design: they are derived or accumulated
 * server-side and must not be settable from a request body.
 */
export const postWriteSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(160, "Title is too long"),
  slug: slugField.optional().default(""),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters").max(320, "Excerpt cannot exceed 320 characters"),
  content: z.string().min(1, "Content is required"),

  coverImage: postImageSchema.nullable().optional(),
  galleryImages: z.array(postImageSchema).max(20, "At most 20 gallery images").optional().default([]),

  tags: tagsField.optional().default([]),
  category: z.string().trim().max(60).optional().nullable(),

  authorName: z.string().trim().min(2, "Author name is required").max(80),
  authorAvatar: z.string().url().optional().nullable().or(z.literal("")),

  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable().or(z.literal("")),

  metaTitle: z.string().trim().max(70, "Meta title should stay under 70 characters").optional().nullable().or(z.literal("")),
  metaDescription: z.string().trim().max(200, "Meta description should stay under 200 characters").optional().nullable().or(z.literal("")),
  ogImage: z.string().url().optional().nullable().or(z.literal("")),
  canonicalUrl: z.string().url().optional().nullable().or(z.literal("")),
  noindex: z.boolean().default(false),
});

export type PostWriteInput = z.infer<typeof postWriteSchema>;

/** PATCH accepts any subset of the same fields. */
export const postUpdateSchema = postWriteSchema.partial();

/** Query string for the admin list. */
export const adminListQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED"]).optional().default("ALL"),
  tag: z.string().trim().max(40).optional().default(""),
  sort: z.enum(["newest", "oldest", "views"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
