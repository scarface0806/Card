import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import {
  isAllowedAdminUploadFolder,
  isCloudinaryConfigured,
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
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Set CLOUDINARY_URL or the three CLOUDINARY_* variables." },
        { status: 503 }
      );
    }

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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(fileValue.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF." },
        { status: 400 }
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

    return NextResponse.json({ success: true, url, publicId }, { status: 200 });
  } catch (error) {
    console.error("Admin upload error:", error);
    const providerError = error as { http_code?: number };
    const message = providerError.http_code === 401
      ? "Cloudinary authentication failed. Verify CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
      : "Cloudinary upload failed. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: providerError.http_code === 401 ? 502 : 500 }
    );
  }
}

export const POST = withAdmin(handler);
