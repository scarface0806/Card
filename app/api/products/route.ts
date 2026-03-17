import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import type { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

type ProductInput = {
  name: string;
  description: string;
  price: number;
  image: string;
};

function normalizeProductInput(payload: unknown): ProductInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request body");
  }

  const input = payload as Record<string, unknown>;
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const image = String(input.image || "").trim();
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
  };
}

function mapProduct(doc: Record<string, unknown>) {
  return {
    id: String(doc._id || ""),
    name: String(doc.name || ""),
    description: String(doc.description || ""),
    price: Number(doc.price || 0),
    image: String(doc.image || ""),
    createdAt: doc.createdAt,
  };
}

// GET /api/products - Get all products (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("limit") || "0");
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 0;

    const db = await getMongoDb();
    const cursor = db.collection("products").find({}).sort({ createdAt: -1 });
    if (limit > 0) {
      cursor.limit(limit);
    }

    const docs = await cursor.toArray();
    const products = docs.map((doc) => mapProduct(doc as unknown as Record<string, unknown>));

    return successResponse({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return errorResponse("Failed to fetch products", 500);
  }
}

// POST /api/products - Create product (Admin only)
async function createProductHandler(request: NextRequest, user: AuthUser) {
  try {
    const body = await request.json();
    const parsed = normalizeProductInput(body);
    const db = await getMongoDb();
    const now = new Date();

    const result = await db.collection("products").insertOne({
      name: parsed.name,
      description: parsed.description,
      price: parsed.price,
      image: parsed.image,
      createdAt: now,
      updatedAt: now,
      // Keep defaults compatible with existing consumers that may still read extra fields.
      isActive: true,
      slug: `product-${Date.now().toString(36)}`,
      images: [parsed.image],
      tags: [],
      stock: 0,
      isFeatured: false,
    });

    return successResponse(
      {
        message: "Product created successfully",
        product: {
          id: String(result.insertedId),
          name: parsed.name,
          description: parsed.description,
          price: parsed.price,
          image: parsed.image,
          createdAt: now,
        },
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
