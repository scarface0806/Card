import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";

import { productCreateSchema } from "@/lib/validators";
import { withRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

// GET /api/products - Get all products (public, only active products)
export async function GET(request: NextRequest) {
  try {
    const rateCheck = checkRateLimit(request, 100);
    if (!rateCheck.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rateCheck.retryAfter) {
        res.headers.set("Retry-After", String(rateCheck.retryAfter));
      }
      return res;
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination (sanitize inputs)
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "12");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 12;
    const skip = (page - 1) * limit;
    
    // Filters
    const category = searchParams.get("category");
    const cardType = searchParams.get("cardType");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = searchParams.get("sortOrder") || "desc";
    const showAll = searchParams.get("showAll"); // Admin param to show inactive

    // Build where clause
    const where: Record<string, unknown> = {};
    
    // Only show active products for public access
    // Admins can see all by passing showAll=true
    if (showAll !== "true") {
      where.isActive = true;
    }

    if (category) {
      where.category = category;
    }

    if (cardType) {
      where.cardType = cardType;
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    const searchText = search?.trim();
    if (searchText) {
      where.OR = [
        { name: { contains: searchText, mode: "insensitive" } },
        { description: { contains: searchText, mode: "insensitive" } },
        { tags: { has: searchText } },
      ];
    }

    const min = minPrice ? parseFloat(minPrice) : undefined;
    const max = maxPrice ? parseFloat(maxPrice) : undefined;
    if (Number.isFinite(min) || Number.isFinite(max)) {
      where.price = {};
      if (Number.isFinite(min)) {
        (where.price as Record<string, number>).gte = min as number;
      }
      if (Number.isFinite(max)) {
        (where.price as Record<string, number>).lte = max as number;
      }
    }

    // Build sort
    const allowedSortBy = new Set(["price", "createdAt", "name"]);
    const sortBy = allowedSortBy.has(sortByParam) ? sortByParam : "createdAt";
    const sortOrder = sortOrderParam === "asc" || sortOrderParam === "desc" ? sortOrderParam : "desc";
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse("Failed to fetch products", 500);
  }
}

// POST /api/products - Create product (Admin only)
async function createProductHandler(request: NextRequest, user: AuthUser) {
  try {
    // basic rate limiting at handler level (in case wrap misses)
    const body = await request.json();

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const data = parsed.data;

    // slug uniqueness
    const existingProduct = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existingProduct) {
      return errorResponse("A product with this slug already exists", 409);
    }
    if (data.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        return errorResponse("A product with this SKU already exists", 409);
      }
    }

    const product = await prisma.product.create({ data });
    return successResponse({ message: "Product created successfully", product }, 201);
  } catch (error) {
    console.error("Create product error:", error);
    return errorResponse("Failed to create product", 500);
  }
}

export const POST = withRateLimit(withAdmin(createProductHandler), 30);
