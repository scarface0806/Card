import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage";
import { postWriteSchema, postUpdateSchema, type PostWriteInput } from "@/lib/blog/schemas";
import {
  buildPostData,
  collectPublicIds,
  orphanedPublicIds,
  recordSlugChange,
  resolveSlug,
} from "@/lib/blog/persist";
import { toAdminPostRow, toPostDetail } from "@/lib/blog/types";
import { previewToken } from "@/lib/blog/tokens";
import type { Post } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function readId(context: RouteContext | undefined): Promise<string | null> {
  const params = await context?.params;
  const id = params?.id ?? "";
  // Mongo ObjectId. Rejecting the shape here means a malformed id returns 400
  // rather than surfacing as a Prisma exception.
  return /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
}

/** The stored post expressed in the same shape the write schema validates. */
function toWriteInput(post: Post): PostWriteInput {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage ?? null,
    galleryImages: post.galleryImages,
    tags: post.tags,
    category: post.category,
    authorName: post.authorName,
    authorAvatar: post.authorAvatar,
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogImage: post.ogImage,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
  };
}

// GET /api/admin/blogs/[id]
async function getHandler(_request: NextRequest, _user: unknown, context?: RouteContext) {
  try {
    const id = await readId(context);
    if (!id) return errorResponse("Invalid post id", 400);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return errorResponse("Post not found", 404);

    return successResponse({ post: toPostDetail(post), previewToken: previewToken(post.id) });
  } catch (error) {
    console.error("Admin blog read error:", error);
    return errorResponse("Failed to load post", 500);
  }
}

// PATCH /api/admin/blogs/[id]
async function updateHandler(request: NextRequest, _user: unknown, context?: RouteContext) {
  try {
    const id = await readId(context);
    if (!id) return errorResponse("Invalid post id", 400);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return errorResponse("Post not found", 404);

    const body = await request.json().catch(() => null);
    const patch = postUpdateSchema.safeParse(body);
    if (!patch.success) {
      return errorResponse(patch.error.issues[0]?.message || "Invalid post data", 400);
    }

    // Merge onto the stored post and re-validate the whole thing, so a PATCH
    // can never leave a record in a state a POST would have rejected.
    const merged = postWriteSchema.safeParse({ ...toWriteInput(existing), ...body });
    if (!merged.success) {
      return errorResponse(merged.error.issues[0]?.message || "Invalid post data", 400);
    }

    const slug = await resolveSlug(merged.data.slug, merged.data.title, id);
    const data = buildPostData(merged.data, slug, existing);

    const updated = await prisma.post.update({ where: { id }, data });

    if (existing.slug !== updated.slug) {
      await recordSlugChange(id, existing.slug, updated.slug);
    }

    // Assets the previous version owned and this one no longer does.
    const orphans = orphanedPublicIds(existing, updated);
    await Promise.all(orphans.map((publicId) => safeDeleteAsset(publicId)));

    return successResponse({
      post: toAdminPostRow(updated),
      previewToken: previewToken(updated.id),
      message: "Post saved",
    });
  } catch (error) {
    console.error("Admin blog update error:", error);
    return errorResponse("Failed to save post", 500);
  }
}

// DELETE /api/admin/blogs/[id]
async function deleteHandler(_request: NextRequest, _user: unknown, context?: RouteContext) {
  try {
    const id = await readId(context);
    if (!id) return errorResponse("Invalid post id", 400);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return errorResponse("Post not found", 404);

    // Database first. If Cloudinary is briefly unreachable the post is still
    // gone from the site; the reverse order could leave a live post whose
    // images have been destroyed.
    await prisma.post.delete({ where: { id } });
    await prisma.postSlugRedirect.deleteMany({ where: { postId: id } });
    await Promise.all(collectPublicIds(existing).map((publicId) => safeDeleteAsset(publicId)));

    return successResponse({ message: "Post deleted" });
  } catch (error) {
    console.error("Admin blog delete error:", error);
    return errorResponse("Failed to delete post", 500);
  }
}

/**
 * A failed asset deletion leaves an orphan in Cloudinary. That is a tidiness
 * problem, not a correctness one, so it is logged rather than failing a
 * request whose database work has already succeeded.
 */
async function safeDeleteAsset(publicId: string): Promise<void> {
  try {
    await deleteCloudinaryImage(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed for", publicId, error);
  }
}

export const GET = withAdmin(getHandler);
export const PATCH = withAdmin(updateHandler);
export const DELETE = withAdmin(deleteHandler);
