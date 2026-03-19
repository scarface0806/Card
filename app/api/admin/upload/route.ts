import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import {
  isAllowedAdminUploadFolder,
  uploadToCloudinary,
} from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const runtime = "nodejs";

async function handler(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folderValue = String(formData.get("folder") || "").trim();
    const fileValue = formData.get("file");

    if (!isAllowedAdminUploadFolder(folderValue)) {
      return NextResponse.json(
        { error: "Invalid folder. Allowed folders are admin/products, admin/customers, admin/cards, admin/profiles, admin/orders." },
        { status: 400 }
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF." },
        { status: 415 }
      );
    }

    if (fileValue.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max size is 5MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await fileValue.arrayBuffer());
    const { url, publicId } = await uploadToCloudinary(buffer, folderValue);

    return NextResponse.json({ url, publicId }, { status: 200 });
  } catch (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json(
      { error: "Cloudinary upload failed" },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(handler);
