import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { customerLeadSchema, mainWebsiteLeadSchema } from "@/lib/validators";
import { errorResponse, successResponse } from "@/lib/responses";
import { sendCustomerLeadNotificationEmail } from "@/lib/email";
import { MongoClient, ObjectId } from "mongodb";

export const runtime = "nodejs";

function isMongoObjectId(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

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

async function createLeadWithMongoFallback(data: {
  customerId: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
}) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = new MongoClient(databaseUrl);
  const dbName = getDatabaseNameFromUri(databaseUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const leads = db.collection("leads");

    const result = await leads.insertOne({
      customerId: new ObjectId(data.customerId),
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message,
      createdAt: new Date(),
    });

    return String(result.insertedId);
  } finally {
    await client.close();
  }
}

async function createMainWebsiteLeadWithMongoFallback(data: {
  name: string;
  phone: string;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  service?: string | null;
}) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = new MongoClient(databaseUrl);
  const dbName = getDatabaseNameFromUri(databaseUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const leads = db.collection("main_website_leads");

    const result = await leads.insertOne({
      source: "main-website",
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      subject: data.subject || null,
      message: data.message || null,
      service: data.service || null,
      createdAt: new Date(),
    });

    return String(result.insertedId);
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 12);
    if (!rl.ok) {
      const response = errorResponse("Too many submissions. Please try again shortly.", 429);
      if (rl.retryAfter) {
        response.headers.set("Retry-After", String(rl.retryAfter));
      }
      return response;
    }

    const body = await request.json();

    const isCustomerSubmission = typeof body?.customerId === "string" && body.customerId.trim().length > 0;

    if (!isCustomerSubmission) {
      const parsedMainLead = mainWebsiteLeadSchema.safeParse(body);

      if (!parsedMainLead.success) {
        return errorResponse(parsedMainLead.error.issues.map((issue) => issue.message).join(", "), 400);
      }

      let leadId: string;
      const leadSource = "main-website";

      try {
        const createdLead = await prisma.mainWebsiteLead.create({
          data: {
            source: leadSource,
            name: parsedMainLead.data.name,
            phone: parsedMainLead.data.phone,
            email: parsedMainLead.data.email || null,
            subject: parsedMainLead.data.subject || null,
            message: parsedMainLead.data.message || null,
            service: parsedMainLead.data.service || null,
          },
        });

        leadId = createdLead.id;
      } catch (error) {
        if (!isReplicaSetRequiredError(error)) {
          throw error;
        }

        leadId = await createMainWebsiteLeadWithMongoFallback({
          name: parsedMainLead.data.name,
          phone: parsedMainLead.data.phone,
          email: parsedMainLead.data.email || null,
          subject: parsedMainLead.data.subject || null,
          message: parsedMainLead.data.message || null,
          service: parsedMainLead.data.service || null,
        });
      }

      return successResponse(
        {
          message: "Lead submitted successfully",
          leadId,
          source: leadSource,
        },
        201
      );
    }

    const parsed = customerLeadSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
    }

    const customerLookup = parsed.data.customerId.trim();

    const customer = await prisma.customer.findFirst({
      where: isMongoObjectId(customerLookup)
        ? {
            OR: [{ id: customerLookup }, { slug: customerLookup }],
          }
        : {
            slug: customerLookup,
          },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
      },
    });

    if (!customer) {
      return errorResponse("Customer profile not found", 404);
    }

    let leadId: string;

    try {
      const lead = await prisma.lead.create({
        data: {
          customerId: customer.id,
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          message: parsed.data.message,
        },
      });

      leadId = lead.id;
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      leadId = await createLeadWithMongoFallback({
        customerId: customer.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message,
      });
    }

    if (customer.email && !parsed.data.skipEmail) {
      try {
        await sendCustomerLeadNotificationEmail({
          to: customer.email,
          customerName: customer.name,
          customerSlug: customer.slug,
          visitorName: parsed.data.name,
          visitorPhone: parsed.data.phone,
          visitorMessage: parsed.data.message,
          visitorEmail: parsed.data.email || undefined,
        });
      } catch (error) {
        console.error("Customer lead email failed:", error);
      }
    }

    return successResponse({
      message: "Message sent successfully",
      leadId,
    }, 201);
  } catch (error) {
    console.error("Create lead error:", error);
    return errorResponse("Failed to submit lead", 500);
  }
}