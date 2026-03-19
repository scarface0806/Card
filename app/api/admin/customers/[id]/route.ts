import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { customerCreateSchema } from "@/lib/validators";
import { ObjectId } from "mongodb";
import { saveUploadedImage } from "@/lib/local-upload";
import { getMongoDb } from "@/lib/mongodb";
import { deleteCloudinaryImage, extractCloudinaryPublicIdFromUrl } from "@/lib/deleteCloudinaryImage";

type CustomerDetailDelegate = {
  findUnique: (args: unknown) => Promise<any>;
  delete: (args: unknown) => Promise<any>;
  update: (args: unknown) => Promise<any>;
};

type RouteParams = { params: Promise<{ id: string }> };

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1" || value === "on";
}

function isReplicaSetRequiredError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2031"
  );
}

async function withMongo<T>(handler: (db: Awaited<ReturnType<typeof getMongoDb>>) => Promise<T>) {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("Missing environment variable");
  }

  const db = await getMongoDb();
  return handler(db);
}

// GET /api/admin/customers/:id - Customer detail (admin only)
async function getHandler(request: NextRequest, user: AuthUser, context: RouteParams) {
  try {
    const customerDelegate = (prisma as unknown as { customer: CustomerDetailDelegate }).customer;
    const { id } = await context.params;
    const customer = await customerDelegate.findUnique({
      where: { id },
      include: {
        galleries: true,
        leads: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!customer) {
      return errorResponse("Customer not found", 404);
    }

    return successResponse({
      customer,
    });
  } catch (error) {
    console.error("Get customer detail error:", error);
    return errorResponse("Failed to fetch customer", 500);
  }
}

// DELETE /api/admin/customers/:id - Delete customer (admin only)
async function deleteHandler(request: NextRequest, user: AuthUser, context: RouteParams) {
  try {
    const customerDelegate = (prisma as unknown as { customer: CustomerDetailDelegate }).customer;
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse("Customer not found", 404);
    }

    let existingCustomer: { id: string; logo?: string | null; profileImage?: string | null } | null = null;
    let existingGalleryImages: string[] = [];

    try {
      existingCustomer = await customerDelegate.findUnique({
        where: { id },
        select: { id: true, logo: true, profileImage: true },
      });

      const existingGalleries = await (prisma as unknown as {
        gallery: { findMany: (args: unknown) => Promise<Array<{ image: string | null }>> };
      }).gallery.findMany({
        where: { customerId: id },
        select: { image: true },
      });

      existingGalleryImages = existingGalleries
        .map((item) => item.image)
        .filter((value): value is string => Boolean(value));
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      existingCustomer = await withMongo(async (db) => {
        const customers = db.collection("customers");
        const galleries = db.collection("galleries");
        const found = await customers.findOne(
          { _id: new ObjectId(id) },
          { projection: { _id: 1, logo: 1, profileImage: 1 } }
        );

        const galleryItems = await galleries
          .find({ customerId: new ObjectId(id) }, { projection: { image: 1 } })
          .toArray();

        existingGalleryImages = galleryItems
          .map((item) => (typeof item.image === "string" ? item.image : null))
          .filter((value): value is string => Boolean(value));

        return found ? { id, logo: found.logo as string | undefined, profileImage: found.profileImage as string | undefined } : null;
      });
    }

    if (!existingCustomer) {
      return errorResponse("Customer not found", 404);
    }

    try {
      await customerDelegate.delete({ where: { id } });
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      await withMongo(async (db) => {
        const customerObjectId = new ObjectId(id);
        const customers = db.collection("customers");
        const galleries = db.collection("galleries");
        const leads = db.collection("leads");

        await galleries.deleteMany({ customerId: customerObjectId });
        await leads.deleteMany({ customerId: customerObjectId });
        const deleted = await customers.deleteOne({ _id: customerObjectId });

        if (deleted.deletedCount === 0) {
          throw new Error("Customer not found");
        }
      });
    }

    const candidateMediaUrls = [
      existingCustomer.logo || null,
      existingCustomer.profileImage || null,
      ...existingGalleryImages,
    ];

    await Promise.allSettled(
      candidateMediaUrls
        .map((url) => extractCloudinaryPublicIdFromUrl(url))
        .filter((publicId): publicId is string => Boolean(publicId))
        .map((publicId) => deleteCloudinaryImage(publicId))
    );

    return successResponse({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete customer error:", error);
    if (error instanceof Error && error.message === "Customer not found") {
      return errorResponse("Customer not found", 404);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to delete customer", 500, { message });
  }
}

// PUT /api/admin/customers/:id - Update customer or toggle status (admin only)
async function putHandler(request: NextRequest, user: AuthUser, context: RouteParams) {
  try {
    const customerDelegate = (prisma as unknown as { customer: CustomerDetailDelegate }).customer;
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return errorResponse("Customer not found", 404);
    }

    const contentType = request.headers.get("content-type") || "";
    let previousProfileImage: string | null = null;

    try {
      const previous = await customerDelegate.findUnique({
        where: { id },
        select: { profileImage: true },
      });
      previousProfileImage = previous?.profileImage || null;
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      const previous = await withMongo(async (db) => {
        const customers = db.collection("customers");
        return customers.findOne(
          { _id: new ObjectId(id) },
          { projection: { profileImage: 1 } }
        );
      });

      previousProfileImage =
        previous && typeof previous.profileImage === "string"
          ? previous.profileImage
          : null;
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const enableGallery = parseBoolean(formData.get("enableGallery"));
      const imageUrl = String(formData.get("imageUrl") || "").trim();

      const parsed = customerCreateSchema.safeParse({
        name: formData.get("name"),
        designation: formData.get("designation"),
        company: formData.get("company"),
        about: formData.get("about"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        mailApiEndpoint: formData.get("mailApiEndpoint") || formData.get("mailApiKey"),
        website: formData.get("website"),
        websiteEnabled: parseBoolean(formData.get("websiteEnabled")),
        linkedin: formData.get("linkedin"),
        linkedinEnabled: parseBoolean(formData.get("linkedinEnabled")),
        whatsapp: formData.get("whatsapp"),
        whatsappEnabled: parseBoolean(formData.get("whatsappEnabled")),
        instagram: formData.get("instagram"),
        instagramEnabled: parseBoolean(formData.get("instagramEnabled")),
        facebook: formData.get("facebook"),
        facebookEnabled: parseBoolean(formData.get("facebookEnabled")),
        behance: formData.get("behance"),
        behanceEnabled: parseBoolean(formData.get("behanceEnabled")),
        address: formData.get("address"),
        mapEmbedUrl: formData.get("mapEmbedUrl"),
        isActive: parseBoolean(formData.get("isActive")),
      });

      if (!parsed.success) {
        return errorResponse(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
      }

      await withMongo(async (db) => {
        const customerObjectId = new ObjectId(id);
        const customers = db.collection("customers");
        const galleries = db.collection("galleries");

        const result = await customers.updateOne(
          { _id: customerObjectId },
          {
            $set: {
              name: parsed.data.name,
              designation: parsed.data.designation || null,
              company: parsed.data.company || null,
              about: parsed.data.about || null,
              phone: parsed.data.phone,
              email: parsed.data.email,
              mailApiEndpoint: parsed.data.mailApiEndpoint || null,
              website: parsed.data.website || null,
              websiteEnabled: parsed.data.websiteEnabled,
              linkedin: parsed.data.linkedin || null,
              linkedinEnabled: parsed.data.linkedinEnabled,
              whatsapp: parsed.data.whatsapp || null,
              whatsappEnabled: parsed.data.whatsappEnabled,
              instagram: parsed.data.instagram || null,
              instagramEnabled: parsed.data.instagramEnabled,
              facebook: parsed.data.facebook || null,
              facebookEnabled: parsed.data.facebookEnabled,
              behance: parsed.data.behance || null,
              behanceEnabled: parsed.data.behanceEnabled,
              address: parsed.data.address || null,
              mapEmbedUrl: parsed.data.mapEmbedUrl || null,
              isActive: parsed.data.isActive,
              ...(imageUrl ? { profileImage: imageUrl } : {}),
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          throw new Error("Customer not found");
        }

        if (!enableGallery) {
          await galleries.deleteMany({ customerId: customerObjectId });
          return;
        }

        const existing = await galleries.find({ customerId: customerObjectId }).toArray();
        const existingBySlot = new Map<number, any>();
        for (const item of existing) {
          if (typeof item.slot === "number") {
            existingBySlot.set(item.slot, item);
          }
        }

        for (let slot = 1; slot <= 3; slot += 1) {
          const galleryFile = formData.get(`galleryImage${slot}`);
          const hoverText = String(formData.get(`galleryHoverText${slot}`) || "").trim();
          const existingItem = existingBySlot.get(slot);
          const image =
            galleryFile instanceof File
              ? await saveUploadedImage(galleryFile, "customers")
              : existingItem?.image || "/no-image-placeholder.svg";

          if (existingItem?._id) {
            await galleries.updateOne(
              { _id: existingItem._id, customerId: customerObjectId },
              { $set: { image, hoverText: hoverText || null, slot } }
            );
          } else {
            await galleries.insertOne({
              customerId: customerObjectId,
              image,
              hoverText: hoverText || null,
              slot,
            });
          }
        }

        await galleries.deleteMany({ customerId: customerObjectId, slot: { $gt: 3 } });
      });

      if (imageUrl && previousProfileImage && previousProfileImage !== imageUrl) {
        const oldPublicId = extractCloudinaryPublicIdFromUrl(previousProfileImage);
        if (oldPublicId) {
          void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
            console.error("Failed to cleanup old customer profile image:", cleanupError);
          });
        }
      }

      return successResponse({
        message: "Customer updated",
        customer: {
          id,
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email,
          isActive: parsed.data.isActive,
        },
      });
    }

    const body = await request.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    const statusOnly = typeof body?.isActive === "boolean" && Object.keys(body || {}).length === 1;

    if (statusOnly) {
      try {
        const updated = await customerDelegate.update({
          where: { id },
          data: { isActive: body.isActive },
        });
        return successResponse({ message: "Customer status updated", customer: updated });
      } catch (error) {
        if (!isReplicaSetRequiredError(error)) {
          throw error;
        }

        await withMongo(async (db) => {
          const customers = db.collection("customers");
          const result = await customers.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: body.isActive, updatedAt: new Date() } }
          );

          if (result.matchedCount === 0) {
            throw new Error("Customer not found");
          }
        });

        return successResponse({
          message: "Customer status updated",
          customer: { id, isActive: body.isActive },
        });
      }
    }

    const parsed = customerCreateSchema.safeParse({
      name: body?.name,
      designation: body?.designation,
      company: body?.company,
      about: body?.about,
      phone: body?.phone,
      email: body?.email,
      mailApiEndpoint: body?.mailApiEndpoint,
      website: body?.website,
      websiteEnabled: body?.websiteEnabled,
      linkedin: body?.linkedin,
      linkedinEnabled: body?.linkedinEnabled,
      whatsapp: body?.whatsapp,
      whatsappEnabled: body?.whatsappEnabled,
      instagram: body?.instagram,
      instagramEnabled: body?.instagramEnabled,
      facebook: body?.facebook,
      facebookEnabled: body?.facebookEnabled,
      behance: body?.behance,
      behanceEnabled: body?.behanceEnabled,
      address: body?.address,
      mapEmbedUrl: body?.mapEmbedUrl,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : true,
    });

    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
    }

    try {
      const updated = await customerDelegate.update({
        where: { id },
        data: {
          name: parsed.data.name,
          designation: parsed.data.designation || null,
          company: parsed.data.company || null,
          about: parsed.data.about || null,
          phone: parsed.data.phone,
          email: parsed.data.email,
          mailApiEndpoint: parsed.data.mailApiEndpoint || null,
          website: parsed.data.website || null,
          websiteEnabled: parsed.data.websiteEnabled,
          linkedin: parsed.data.linkedin || null,
          linkedinEnabled: parsed.data.linkedinEnabled,
          whatsapp: parsed.data.whatsapp || null,
          whatsappEnabled: parsed.data.whatsappEnabled,
          instagram: parsed.data.instagram || null,
          instagramEnabled: parsed.data.instagramEnabled,
          facebook: parsed.data.facebook || null,
          facebookEnabled: parsed.data.facebookEnabled,
          behance: parsed.data.behance || null,
          behanceEnabled: parsed.data.behanceEnabled,
          address: parsed.data.address || null,
          mapEmbedUrl: parsed.data.mapEmbedUrl || null,
          isActive: parsed.data.isActive,
          ...(imageUrl ? { profileImage: imageUrl } : {}),
        },
      });

      if (Array.isArray(body?.gallery)) {
        for (const item of body.gallery) {
          if (!item?.id) {
            continue;
          }

          await (prisma as unknown as { gallery: { update: (args: unknown) => Promise<any> } }).gallery.update({
            where: { id: item.id },
            data: {
              hoverText: item.hoverText ? String(item.hoverText) : null,
            },
          });
        }
      }

      if (imageUrl && previousProfileImage && previousProfileImage !== imageUrl) {
        const oldPublicId = extractCloudinaryPublicIdFromUrl(previousProfileImage);
        if (oldPublicId) {
          void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
            console.error("Failed to cleanup old customer profile image:", cleanupError);
          });
        }
      }

      return successResponse({ message: "Customer updated", customer: updated });
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      await withMongo(async (db) => {
        const customers = db.collection("customers");
        const galleries = db.collection("galleries");

        const result = await customers.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              name: parsed.data.name,
              designation: parsed.data.designation || null,
              company: parsed.data.company || null,
              about: parsed.data.about || null,
              phone: parsed.data.phone,
              email: parsed.data.email,
              mailApiEndpoint: parsed.data.mailApiEndpoint || null,
              website: parsed.data.website || null,
              websiteEnabled: parsed.data.websiteEnabled,
              linkedin: parsed.data.linkedin || null,
              linkedinEnabled: parsed.data.linkedinEnabled,
              whatsapp: parsed.data.whatsapp || null,
              whatsappEnabled: parsed.data.whatsappEnabled,
              instagram: parsed.data.instagram || null,
              instagramEnabled: parsed.data.instagramEnabled,
              facebook: parsed.data.facebook || null,
              facebookEnabled: parsed.data.facebookEnabled,
              behance: parsed.data.behance || null,
              behanceEnabled: parsed.data.behanceEnabled,
              address: parsed.data.address || null,
              mapEmbedUrl: parsed.data.mapEmbedUrl || null,
              isActive: parsed.data.isActive,
              ...(imageUrl ? { profileImage: imageUrl } : {}),
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          throw new Error("Customer not found");
        }

        if (Array.isArray(body?.gallery)) {
          for (const item of body.gallery) {
            if (!item?.id || !ObjectId.isValid(item.id)) {
              continue;
            }

            await galleries.updateOne(
              { _id: new ObjectId(item.id), customerId: new ObjectId(id) },
              {
                $set: {
                  hoverText: item.hoverText ? String(item.hoverText) : null,
                },
              }
            );
          }
        }
      });

      if (imageUrl && previousProfileImage && previousProfileImage !== imageUrl) {
        const oldPublicId = extractCloudinaryPublicIdFromUrl(previousProfileImage);
        if (oldPublicId) {
          void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
            console.error("Failed to cleanup old customer profile image:", cleanupError);
          });
        }
      }

      return successResponse({
        message: "Customer updated",
        customer: {
          id,
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email,
          isActive: parsed.data.isActive,
        },
      });
    }
  } catch (error) {
    console.error("Update customer error:", error);
    if (error instanceof Error && error.message === "Customer not found") {
      return errorResponse("Customer not found", 404);
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to update customer", 500, { message });
  }
}

export const GET = withRateLimit(withAdmin(getHandler), 30);
export const DELETE = withRateLimit(withAdmin(deleteHandler), 20);
export const PUT = withRateLimit(withAdmin(putHandler), 30);
export const runtime = "nodejs";
