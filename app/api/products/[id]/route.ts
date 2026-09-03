import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import type { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";
import { deleteCloudinaryImage, extractCloudinaryPublicIdFromUrl } from "@/lib/deleteCloudinaryImage";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

/** Every field the API returns for a product. Mirrors the list route. */
const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  salePrice: true,
  images: true,
  backImage: true,
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
   * The back of the card. OPTIONAL, unlike `image`. `null` means "no back
   * image" and is written as such, so clearing it in the admin form clears it
   * in the database rather than silently keeping the old one.
   */
  backImage: string | null;
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
  };
}

/**
 * Cloudinary assets this product no longer references.
 *
 * A URL is only orphaned when it appears in NEITHER slot afterwards. Comparing
 * one slot against itself - which is what this route used to do - deletes the
 * wrong asset the moment the two images are swapped, or the old front is
 * promoted to the back: the URL is still in use, but the front-to-front
 * comparison says it changed, and the asset is destroyed out from under the
 * product that is still pointing at it.
 */
function orphanedImageUrls(
  before: ReadonlyArray<string | null | undefined>,
  after: ReadonlyArray<string | null | undefined>
): string[] {
  const stillUsed = new Set(after.filter((url): url is string => Boolean(url)));
  const orphans = new Set(
    before.filter((url): url is string => Boolean(url) && !stillUsed.has(url as string))
  );
  return [...orphans];
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
    cardType: p.cardType,
    material: p.material,
    color: p.color,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
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
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        salePrice: true,
        images: true,
        backImage: true,
        cardType: true,
        material: true,
        color: true,
        isActive: true,
        isFeatured: true,
        createdAt: true,
      },
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
      select: { images: true, backImage: true },
    });

    if (!existing) {
      return errorResponse("Product not found", 404);
    }

    const previousImages = [existing.images?.[0], existing.backImage];

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description,
        price: parsed.price,
        images: [parsed.image],
        backImage: parsed.backImage,
      },
      select: PRODUCT_SELECT,
    }).catch((e: { code?: string }) => {
      if (e?.code === "P2025") return null;
      throw e;
    });

    if (!updated) {
      return errorResponse("Product not found", 404);
    }

    // Only assets that survive in neither slot. A front/back swap therefore
    // deletes nothing, which is the whole point of going through
    // orphanedImageUrls rather than comparing slot to slot.
    for (const orphan of orphanedImageUrls(previousImages, [
      parsed.image,
      parsed.backImage,
    ])) {
      const oldPublicId = extractCloudinaryPublicIdFromUrl(orphan);
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
      select: { images: true, backImage: true },
    });

    if (!existing) {
      return errorResponse("Product not found", 404);
    }

    await prisma.product.delete({ where: { id } }).catch((e: { code?: string }) => {
      if (e?.code === "P2025") return null;
      throw e;
    });

    // The product is gone, so both faces are orphaned - nothing survives.
    for (const orphan of orphanedImageUrls(
      [existing.images?.[0], existing.backImage],
      []
    )) {
      const oldPublicId = extractCloudinaryPublicIdFromUrl(orphan);
      if (oldPublicId) {
        void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
          console.error("Failed to cleanup deleted product image:", cleanupError);
        });
      }
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
