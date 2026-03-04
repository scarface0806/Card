import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";

import { productUpdateSchema } from "@/lib/validators";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/products/:id - Get single product (public)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Check if id is a valid ObjectId or a slug
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const product = await prisma.product.findFirst({
      where: isObjectId
        ? { id, isActive: true }
        : { slug: id, isActive: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id - Update product (Admin only)
async function updateProductHandler(
  request: NextRequest,
  user: AuthUser,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // parse + validate body
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const data = parsed.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return errorResponse("Product not found", 404);
    }

    // slug/sku uniqueness checks
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        return errorResponse("A product with this slug already exists", 409);
      }
    }
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuExists) {
        return errorResponse("A product with this SKU already exists", 409);
      }
    }

    // update
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return successResponse({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Update product error:", error);
    return errorResponse("Failed to update product", 500);
  }
}

// DELETE /api/products/:id - Delete product (Admin only)
async function deleteProductHandler(
  request: NextRequest,
  user: AuthUser,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return errorResponse("Product not found", 404);
    }

    await prisma.product.update({ where: { id }, data: { isActive: false } });

    return successResponse({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return errorResponse("Failed to delete product", 500);
  }
}

// Wrap admin handlers with route params + rate limit
export const PUT = (request: NextRequest, context: RouteParams) =>
  withRateLimit(
    withAdmin((req, user) => updateProductHandler(req, user, context)),
    30
  )(request);

export const DELETE = (request: NextRequest, context: RouteParams) =>
  withRateLimit(
    withAdmin((req, user) => deleteProductHandler(req, user, context)),
    30
  )(request);
