import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { customerCreateSchema } from "@/lib/validators";
import { MongoClient, ObjectId } from "mongodb";

type CustomerDetailDelegate = {
  findUnique: (args: unknown) => Promise<any>;
  delete: (args: unknown) => Promise<any>;
  update: (args: unknown) => Promise<any>;
};

type RouteParams = { params: Promise<{ id: string }> };

function isReplicaSetRequiredError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2031"
  );
}

function getDatabaseNameFromUri(uri: string) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, "").trim();
    return pathname || "tapvyo-nfc";
  } catch {
    return "tapvyo-nfc";
  }
}

async function withMongo<T>(handler: (db: Awaited<ReturnType<MongoClient["db"]>>) => Promise<T>) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = new MongoClient(databaseUrl);
  const dbName = getDatabaseNameFromUri(databaseUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    return await handler(db);
  } finally {
    await client.close();
  }
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

    let existingCustomer: { id: string } | null = null;

    try {
      existingCustomer = await customerDelegate.findUnique({
        where: { id },
        select: { id: true },
      });
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      existingCustomer = await withMongo(async (db) => {
        const customers = db.collection("customers");
        const found = await customers.findOne({ _id: new ObjectId(id) }, { projection: { _id: 1 } });
        return found ? { id } : null;
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

    return successResponse({ message: "Customer deleted successfully" });
  } catch (error) {
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

    const body = await request.json();

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
