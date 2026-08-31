import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import { getBlogStats, getTopPosts, getViewsSeries } from "@/lib/blog/queries";

export const runtime = "nodejs";

/** GET /api/admin/blogs/stats — stat cards, top posts and the 30-day series. */
async function handler() {
  try {
    const [stats, topPosts, series] = await Promise.all([
      getBlogStats(),
      getTopPosts(5),
      getViewsSeries(30),
    ]);

    return successResponse({ stats, topPosts, series });
  } catch (error) {
    console.error("Admin blog stats error:", error);
    return errorResponse("Failed to load blog analytics", 500);
  }
}

export const GET = withAdmin(handler);
