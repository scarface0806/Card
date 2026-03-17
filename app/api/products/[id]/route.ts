import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import type { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

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

// GET /api/products/:id - Get single product (public)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return errorResponse("Invalid product id", 400);
    }

    const db = await getMongoDb();
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });

    if (!product) {
      return errorResponse("Product not found", 404);
    }

    return successResponse({ product: mapProduct(product as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error("Get product error:", error);
    return errorResponse("Failed to fetch product", 500);
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

    if (!ObjectId.isValid(id)) {
      return errorResponse("Invalid product id", 400);
    }

    const body = await request.json();
    const parsed = normalizeProductInput(body);
    const db = await getMongoDb();
    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: parsed.name,
          description: parsed.description,
          price: parsed.price,
          image: parsed.image,
          images: [parsed.image],
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return errorResponse("Product not found", 404);
    }

    const updated = await db.collection("products").findOne({ _id: new ObjectId(id) });
    return successResponse({
      message: "Product updated successfully",
      product: updated ? mapProduct(updated as unknown as Record<string, unknown>) : null,
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
  user: AuthUser,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return errorResponse("Invalid product id", 400);
    }

    const db = await getMongoDb();
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return errorResponse("Product not found", 404);
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
