import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import type { AuthUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

async function deleteHandler(
  request: NextRequest,
  user: AuthUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return errorResponse("Invalid lead ID", 400);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") === "nfc" ? "nfc" : "main";

    if (type === "nfc") {
      const existing = await prisma.lead.findUnique({ where: { id } });
      if (!existing) {
        return errorResponse("Lead not found", 404);
      }
      await prisma.lead.delete({ where: { id } });
    } else {
      const mainLeadDelegate = prisma as unknown as {
        mainWebsiteLead: {
          findUnique: (args: unknown) => Promise<unknown>;
          delete: (args: unknown) => Promise<unknown>;
        };
      };
      const existing = await mainLeadDelegate.mainWebsiteLead.findUnique({
        where: { id },
      });
      if (!existing) {
        return errorResponse("Lead not found", 404);
      }
      await mainLeadDelegate.mainWebsiteLead.delete({ where: { id } });
    }

    return successResponse({ id, message: "Lead deleted successfully" }, 200);
  } catch (error) {
    console.error("Delete lead error:", error);
    return errorResponse("Failed to delete lead", 500);
  }
}

export const DELETE = withAdmin(deleteHandler);
