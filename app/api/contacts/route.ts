import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/responses";
import { getMongoDb } from "@/lib/mongodb";
import { z } from "zod";
import { ObjectId } from "mongodb";

// Contact document type from MongoDB
interface ContactDocument {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  message: string;
  subject?: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export const runtime = "nodejs";

// Validation schema for contact submissions
const contactSubmitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(6, "Phone is required").max(30),
  message: z.string().trim().min(1, "Message is required").max(2000),
  subject: z.string().trim().max(250).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parsed = contactSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues.map((issue) => issue.message).join(", "),
        400
      );
    }

    // Get MongoDB connection
    const db = await getMongoDb();
    const contacts = db.collection("contacts");

    // Insert contact document
    const insertResult = await contacts.insertOne({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      subject: parsed.data.subject || null,
      source: "website",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return successResponse(
      {
        message: "Contact form submitted successfully",
        contactId: insertResult.insertedId.toString(),
      },
      201
    );
  } catch (error) {
    console.error("Create contact error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to submit contact form", 500, { message });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get MongoDB connection
    const db = await getMongoDb();
    const contacts = db.collection("contacts");

    // Get pagination parameters from query
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    // Fetch contacts
    const contactsList = await contacts
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray() as ContactDocument[];

    // Get total count
    const total = await contacts.countDocuments();

    // Transform for response
    const transformed = contactsList.map((contact) => ({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
      subject: contact.subject,
      source: contact.source,
      createdAt: contact.createdAt,
    }));

    return successResponse(
      {
        contacts: transformed,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      200
    );
  } catch (error) {
    console.error("Fetch contacts error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse("Failed to fetch contacts", 500, { message });
  }
}
