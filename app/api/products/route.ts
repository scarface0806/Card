import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import type { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

/** Every field the API returns for a product. Kept in one place so the GET,
 *  the POST and the mapper cannot drift apart. */
const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  salePrice: true,
  images: true,
  backImage: true,
  orientation: true,
  cardType: true,
  material: true,
  color: true,
  isActive: true,
  isFeatured: true,
  createdAt: true,
} as const;

type ProductInput = {
  name: string;
  description: string;
  price: number;
  image: string;
  imageUrl?: string;
  /**
   * The back of the card. OPTIONAL, unlike `image` - a product with no back
   * image is entirely normal, and the catalogue just does not offer the flip.
   * `null` means "no back image", and is written as such so that clearing the
   * field in the admin form actually clears it.
   */
  backImage: string | null;
  /**
   * Card shape: "horizontal" | "vertical". Always a concrete string here even
   * though the column is nullable - the parser below resolves absence to
   * "horizontal" so nothing downstream has to. See lib/products/orientation.ts.
   */
  orientation: string;
};

function normalizeProductInput(payload: unknown): ProductInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid request body");
  }

  const input = payload as Record<string, unknown>;
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const image = String(input.image || input.imageUrl || "").trim();
  const backImage = String(input.backImage || input.backImageUrl || "").trim();
  // Anything that is not the literal "vertical" is stored as horizontal, so a
  // missing or unexpected value can never produce a third shape.
  const orientation = input.orientation === "vertical" ? "vertical" : "horizontal";
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
    backImage: backImage || null,
    orientation,
  };
}

function mapProduct(p: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  images: string[];
  backImage: string | null;
  orientation: string | null;
  cardType: string | null;
  material: string | null;
  color: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: p.price,
    salePrice: p.salePrice,
    images: p.images || [],
    image: p.images[0] || "",
    // Nullable, not "": the client treats absent as "this card has no back".
    backImage: p.backImage || null,
    orientation: p.orientation || "horizontal",
    cardType: p.cardType,
    material: p.material,
    color: p.color,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
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
      select: PRODUCT_SELECT,
    });

    return successResponse({
      products: products.map(mapProduct),
      count: products.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Get products error:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
    } else {
      console.error("Get products error:", error);
    }

    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Failed to fetch products";

    return errorResponse(message, 500);
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
        backImage: parsed.backImage,
        orientation: parsed.orientation,
        slug: `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        isActive: true,
        tags: [],
        stock: 0,
        isFeatured: false,
      },
      select: PRODUCT_SELECT,
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
