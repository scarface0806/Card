import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import type { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";
import { deleteCloudinaryImage, extractCloudinaryPublicIdFromUrl } from "@/lib/deleteCloudinaryImage";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

type ProductInput = {
  name: string;
  description: string;
  price: number;
  image: string;
  imageUrl?: string;
};

function normalizeProductInput(payload: unknown): ProductInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request body");
  }

  const input = payload as Record<string, unknown>;
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const image = String(input.image || input.imageUrl || "").trim();
  const priceNumber = Number(input.price);

  if (!name) {
    throw new Error("Name is required");
  }

  if (!description) {
    throw new Error("Description is required");
  }

  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    throw new Error("Price must be a valid positive number");
  }

  if (!image) {
    throw new Error("Image is required");
  }

  return {
    name,
    description,
    price: priceNumber,
    image,
    imageUrl: String(input.imageUrl || "").trim() || undefined,
  };
}

function mapProduct(p: { id: string; name: string; description: string | null; price: number; images: string[]; createdAt: Date }) {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: p.price,
    image: p.images[0] || "",
    createdAt: p.createdAt,
  };
}

// GET /api/products/:id - Get single product (public)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, price: true, images: true, createdAt: true },
    });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return successResponse({ product: mapProduct(product) });
  } catch (error) {
    console.error("Get product error:", error);
    return errorResponse("Failed to fetch product", 500);
  }
}

// PUT /api/products/:id - Update product (Admin only)
async function updateProductHandler(
  request: NextRequest,
  _user: AuthUser,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = normalizeProductInput(body);

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!existing) {
      return errorResponse("Product not found", 404);
    }

    const previousImage = existing.images?.[0] || "";

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        images: [parsed.image],
      },
      select: { id: true, name: true, description: true, price: true, images: true, createdAt: true },
    }).catch((e: { code?: string }) => {
      if (e?.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
      return errorResponse("Product not found", 404);
    }

    if (previousImage && previousImage !== parsed.image) {
      const oldPublicId = extractCloudinaryPublicIdFromUrl(previousImage);
      if (oldPublicId) {
        void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
          console.error("Failed to cleanup old product image:", cleanupError);
        });
      }
    }

    return successResponse({
      message: "Product updated successfully",
      product: mapProduct(updated),
    });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    console.error("Update product error:", error);
    return errorResponse("Failed to update product", 500);
  }
}

// DELETE /api/products/:id - Delete product (Admin only)
async function deleteProductHandler(
  request: NextRequest,
  _user: AuthUser,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!existing) {
      return errorResponse("Product not found", 404);
    }

    await prisma.product.delete({ where: { id } }).catch((e: { code?: string }) => {
      if (e?.code === "P2025") return null;
      throw e;
    });

    const previousImage = existing.images?.[0] || "";
    const oldPublicId = extractCloudinaryPublicIdFromUrl(previousImage);
    if (oldPublicId) {
      void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
        console.error("Failed to cleanup deleted product image:", cleanupError);
      });
    }

    return successResponse({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return errorResponse("Failed to delete product", 500);
  }
}

// Wrap admin handlers with route params
export const PUT = (request: NextRequest, context: RouteParams) =>
  withAdmin((req, user) => updateProductHandler(req, user, context))(request);

export const DELETE = (request: NextRequest, context: RouteParams) =>
  withAdmin((req, user) => deleteProductHandler(req, user, context))(request);
