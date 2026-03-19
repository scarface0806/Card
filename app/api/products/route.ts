import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import type { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

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

// GET /api/products - Get all products (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") || "0");
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 0;

    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit > 0 ? limit : undefined,
      select: { id: true, name: true, description: true, price: true, images: true, createdAt: true },
    });

    return successResponse({
      products: products.map(mapProduct),
      count: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse("Failed to fetch products", 500);
  }
}

// POST /api/products - Create product (Admin only)
async function createProductHandler(request: NextRequest, _user: AuthUser) {
  try {
    const body = await request.json();
    const parsed = normalizeProductInput(body);

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        images: [parsed.image],
        slug: `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        isActive: true,
        tags: [],
        stock: 0,
        isFeatured: false,
      },
      select: { id: true, name: true, description: true, price: true, images: true, createdAt: true },
    });

    return successResponse(
      {
        message: "Product created successfully",
        product: mapProduct(product),
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    console.error("Create product error:", error);
    return errorResponse("Failed to create product", 500);
  }
}

export const POST = withAdmin(createProductHandler);
