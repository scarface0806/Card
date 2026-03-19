import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { customerCreateSchema } from "@/lib/validators";
import { saveUploadedImage } from "@/lib/local-upload";
import { generateUniqueCustomerSlug } from "@/lib/customer-slug";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import type { AuthUser } from "@/lib/auth";

export const runtime = "nodejs";

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

async function createCustomerWithMongoFallback(params: {
  parsedData: {
    name: string;
    designation?: string | null;
    company?: string | null;
    about?: string | null;
    phone: string;
    email: string;
    mailApiEndpoint?: string | null;
    website?: string | null;
    websiteEnabled: boolean;
    linkedin?: string | null;
    linkedinEnabled: boolean;
    whatsapp?: string | null;
    whatsappEnabled: boolean;
    instagram?: string | null;
    instagramEnabled: boolean;
    facebook?: string | null;
    facebookEnabled: boolean;
    behance?: string | null;
    behanceEnabled: boolean;
    address?: string | null;
    mapEmbedUrl?: string | null;
    isActive: boolean;
  };
  logo: string | null;
  profileImage: string | null;
  formData: FormData;
  enableGallery: boolean;
}) {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("Missing environment variable");
  }

  const db = await getMongoDb();
  const customers = db.collection("customers");
  const galleries = db.collection("galleries");

  const now = new Date();
  const insertResult = await customers.insertOne({
    name: params.parsedData.name,
    designation: params.parsedData.designation || null,
    company: params.parsedData.company || null,
    about: params.parsedData.about || null,
    phone: params.parsedData.phone,
    email: params.parsedData.email,
    mailApiEndpoint: params.parsedData.mailApiEndpoint || null,
    website: params.parsedData.website || null,
    websiteEnabled: params.parsedData.websiteEnabled,
    linkedin: params.parsedData.linkedin || null,
    linkedinEnabled: params.parsedData.linkedinEnabled,
    whatsapp: params.parsedData.whatsapp || null,
    whatsappEnabled: params.parsedData.whatsappEnabled,
    instagram: params.parsedData.instagram || null,
    instagramEnabled: params.parsedData.instagramEnabled,
    facebook: params.parsedData.facebook || null,
    facebookEnabled: params.parsedData.facebookEnabled,
    behance: params.parsedData.behance || null,
    behanceEnabled: params.parsedData.behanceEnabled,
    address: params.parsedData.address || null,
    mapEmbedUrl: params.parsedData.mapEmbedUrl || null,
    logo: params.logo,
    profileImage: params.profileImage,
    isActive: params.parsedData.isActive,
    slug: "",
    createdAt: now,
    updatedAt: now,
  });

  const customerId = String(insertResult.insertedId);
  const baseSlug = `tapvyonfc-${customerId.slice(-6).toLowerCase()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await customers.findOne({ slug }, { projection: { _id: 1 } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  await customers.updateOne(
    { _id: insertResult.insertedId },
    { $set: { slug, updatedAt: new Date() } }
  );

  if (params.enableGallery) {
    for (let slot = 1; slot <= 3; slot += 1) {
      const galleryFile = params.formData.get(`galleryImage${slot}`);
      const hoverText = String(params.formData.get(`galleryHoverText${slot}`) || "").trim();
      const image = galleryFile instanceof File ? await saveUploadedImage(galleryFile, "customers") : null;

      await galleries.insertOne({
        customerId: new ObjectId(customerId),
        image: image || "/no-image-placeholder.svg",
        hoverText: hoverText || null,
        slot,
      });
    }
  }

  return {
    id: customerId,
    slug,
  };
}

async function postHandler(request: NextRequest, user: AuthUser) {
  try {
    const formData = await request.formData();
    const enableGallery = parseBoolean(formData.get("enableGallery"));

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

    const logoFile = formData.get("logo");
    const profileImageFile = formData.get("profileImage");
    const imageUrl = String(formData.get("imageUrl") || "").trim();

    const logo = logoFile instanceof File ? await saveUploadedImage(logoFile, "customers") : null;
    const profileImage =
      profileImageFile instanceof File
        ? await saveUploadedImage(profileImageFile, "customers")
        : imageUrl || null;

    let customerId: string;
    let slug: string;

    try {
      const tempSlug = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const customer = await prisma.customer.create({
        data: {
          ...parsed.data,
          designation: parsed.data.designation || null,
          company: parsed.data.company || null,
          about: parsed.data.about || null,
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
          logo,
          profileImage,
          isActive: parsed.data.isActive,
          slug: tempSlug,
        },
      });

      slug = await generateUniqueCustomerSlug(customer.id);

      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: { slug },
      });

      if (enableGallery) {
        for (let slot = 1; slot <= 3; slot += 1) {
          const galleryFile = formData.get(`galleryImage${slot}`);
          const hoverText = String(formData.get(`galleryHoverText${slot}`) || "").trim();
          const image = galleryFile instanceof File ? await saveUploadedImage(galleryFile, "customers") : null;

          await prisma.gallery.create({
            data: {
              customerId: customer.id,
              image: image || "/no-image-placeholder.svg",
              hoverText: hoverText || null,
              slot,
            },
          });
        }
      }

      customerId = updatedCustomer.id;
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      const fallback = await createCustomerWithMongoFallback({
        parsedData: parsed.data,
        logo,
        profileImage,
        formData,
        enableGallery,
      });

      customerId = fallback.id;
      slug = fallback.slug;
    }

    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const link = `${origin}/card/${slug}`;

    return successResponse(
      {
        message: "Customer created successfully",
        customer: {
          id: customerId,
          name: parsed.data.name,
          slug,
          link,
        },
        slug,
        link,
      },
      201
    );
  } catch (error) {
    console.error("Create customer error:", error);

    if (isReplicaSetRequiredError(error)) {
      return errorResponse("Failed to create customer on current database setup.", 503, {
        message:
          "Prisma requires replica-set transactions for writes. Start with `npm run dev:db` or enable replica set on local MongoDB.",
        code: "P2031",
      });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to create customer", 500, { message });
  }
}

async function getHandler(request: NextRequest, user: AuthUser) {
  try {
    const customerDelegate = (prisma as unknown as {
      customer: {
        findMany: (args?: unknown) => Promise<Array<{
          id: string;
          name: string;
          slug: string;
          email: string;
          phone: string;
          isActive: boolean;
          createdAt: Date;
          updatedAt: Date;
        }>>;
      };
    }).customer;

    const customers = await customerDelegate.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({
      customers,
      count: customers.length,
    });
  } catch (error) {
    console.error("Get customers list error:", error);
    return errorResponse("Failed to fetch customers", 500);
  }
}

export const GET = withAdmin(getHandler);
export const POST = withRateLimit(withAdmin(postHandler), 20);