import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";
import { adminListQuerySchema, postWriteSchema } from "@/lib/blog/schemas";
import { listAdminPosts } from "@/lib/blog/queries";
import { buildPostData, resolveSlug } from "@/lib/blog/persist";
import { toAdminPostRow } from "@/lib/blog/types";
import { previewToken } from "@/lib/blog/tokens";

export const runtime = "nodejs";

// GET /api/admin/blogs — paginated, searchable, filterable list
async function listHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = adminListQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "Invalid query", 400);
    }

    const { posts, total, totalPages } = await listAdminPosts(parsed.data);

    return successResponse({
      posts,
      total,
      totalPages,
      page: parsed.data.page,
      perPage: parsed.data.perPage,
    });
  } catch (error) {
    console.error("Admin blog list error:", error);
    return errorResponse("Failed to load posts", 500);
  }
}

// POST /api/admin/blogs — create
async function createHandler(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = postWriteSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "Invalid post data", 400);
    }

    const slug = await resolveSlug(parsed.data.slug, parsed.data.title);
    const post = await prisma.post.create({
      data: buildPostData(parsed.data, slug),
    });

    return successResponse(
      { post: toAdminPostRow(post), previewToken: previewToken(post.id), message: "Post created" },
      201
    );
  } catch (error) {
    console.error("Admin blog create error:", error);
    return errorResponse("Failed to create post", 500);
  }
}

export const GET = withAdmin(listHandler);
export const POST = withAdmin(createHandler);
