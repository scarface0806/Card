import { NextRequest, NextResponse } from "next/server";

import { authenticate } from "@/lib/auth-middleware";
import { isCloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import {
  MAX_ARTWORK_BYTES,
  customCardFolder,
  validateArtworkFile,
} from "@/lib/custom-card-artwork";
import { consumeRateLimit, MongoRateLimitUnavailableError } from "@/lib/mongo-rate-limit";

/**
 * POST /api/uploads/custom-card
 *
 * A signed-in customer uploads ONE artwork image (card front or back) for a
 * Customised Card order. Returns { url, publicId, width, height }; the checkout
 * keeps those in form state and POST /api/orders re-checks the URL belongs to
 * this customer before it is saved on the order.
 *
 * Unlike /api/admin/upload this is customer-facing, so:
 *  - Login is required (the same auth-token JWT check as /api/orders).
 *  - It is rate-limited PER USER in the shared rate_limits collection, so a
 *    logged-in account cannot be used to fill our Cloudinary storage.
 *  - The folder is not taken from the request. It is always
 *    custom-cards/<userId>/, which is what lets the order route verify
 *    ownership by URL alone.
 *  - The file type is checked from its bytes, not just the declared MIME type.
 *
 * Uploads from a checkout that is abandoned stay in Cloudinary; there is no
 * cleanup job yet. The publicIds saved on orders make the used ones findable.
 */

export const runtime = "nodejs";

/** Enough for a full checkout plus a few replacements; stops a script. */
const UPLOAD_WINDOWS = [
  { name: "burst", windowMs: 10 * 60 * 1000, limit: 20 },
  { name: "daily", windowMs: 24 * 60 * 60 * 1000, limit: 60 },
] as const;

/** Multipart framing on top of the file itself. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  const { user } = await authenticate(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in to upload your artwork." }, { status: 401 });
  }

  // Refuse an oversized body before reading it into memory. The real size
  // check is on the parsed file below; this one only saves the work.
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_ARTWORK_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return NextResponse.json({ error: "File too large. The maximum size is 10MB." }, { status: 413 });
  }

  try {
    const decision = await consumeRateLimit("custom-card-upload", user.id, UPLOAD_WINDOWS);
    if (!decision.ok) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a few minutes and try again." },
        { status: 429, headers: { "Retry-After": String(decision.retryAfter ?? 60) } }
      );
    }
  } catch (error) {
    // Fail closed: no shared limiter, no uploads.
    if (error instanceof MongoRateLimitUnavailableError) {
      console.error("[custom-card-upload]", error.message);
      return NextResponse.json(
        { error: "Uploads are unavailable right now. Please try again shortly." },
        { status: 503 }
      );
    }
    throw error;
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Uploads are unavailable right now. Please try again shortly." },
      { status: 503 }
    );
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateArtworkFile({
    type: file.type,
    size: file.size,
    bytes: new Uint8Array(buffer),
  });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const folder = customCardFolder(user.id);

  try {
    const { url, publicId, width, height } = await uploadToCloudinary(buffer, folder);

    // The order route trusts an artwork URL only when its public id sits in
    // this folder. If the Cloudinary account ever stops prefixing public ids
    // with the folder, say so here rather than letting every order fail later.
    if (!publicId.startsWith(`${folder}/`)) {
      console.error("[custom-card-upload] unexpected public id outside folder:", publicId);
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ url, publicId, width, height }, { status: 200 });
  } catch (error) {
    console.error("[custom-card-upload] Cloudinary upload failed:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 502 });
  }
}
