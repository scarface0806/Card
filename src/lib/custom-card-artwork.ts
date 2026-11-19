/**
 * Customer uploads at checkout: the profile photo (every product) and the
 * front/back artwork for "Customised Card" products. SERVER-ONLY (no secrets
 * here, but nothing client-side needs it). Each purpose has its own folder -
 * see UPLOAD_FOLDER_ROOTS - and the cleanup job in lib/upload-cleanup.ts only
 * ever touches those folders.
 *
 * Two jobs, both security boundaries:
 *
 * 1. validateArtworkFile - what POST /api/uploads/custom-card accepts. The
 *    declared MIME type comes from the browser and is trivially forged, so the
 *    file's first bytes are checked too: a renamed .exe or an SVG (which can
 *    carry script) labelled image/png is refused.
 *
 * 2. parseOwnArtworkUrl - what POST /api/orders accepts as the front/back
 *    image. The order body is client-controlled, so a URL is only trusted when
 *    it points at OUR Cloudinary cloud AND at the uploading customer's own
 *    custom-cards/<userId>/ folder. Without this, an order could reference an
 *    arbitrary site's image, or another customer's artwork, and the admin would
 *    print it.
 */

export const MAX_ARTWORK_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ARTWORK_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ArtworkMimeType = (typeof ALLOWED_ARTWORK_TYPES)[number];

/**
 * What a checkout upload is for. Each purpose has its own root folder, so the
 * order route can check a URL is not just "this customer's" but the RIGHT
 * kind - a profile photo cannot be submitted as card artwork, or vice versa.
 */
export type UploadPurpose = 'artwork' | 'profile';

export const UPLOAD_FOLDER_ROOTS: Record<UploadPurpose, string> = {
  artwork: 'custom-cards',
  profile: 'profile-photos',
};

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return value === 'artwork' || value === 'profile';
}

/** Cloudinary folder for one customer's uploads of one purpose. */
export function uploadFolder(purpose: UploadPurpose, userId: string): string {
  return `${UPLOAD_FOLDER_ROOTS[purpose]}/${userId}`;
}

/** Cloudinary folder for one customer's card artwork. */
export function customCardFolder(userId: string): string {
  return uploadFolder('artwork', userId);
}

/**
 * The real type of an image from its leading bytes, or null when it is not a
 * JPEG, PNG or WEBP.
 */
export function detectImageType(bytes: Uint8Array): ArtworkMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= PNG.length && PNG.every((byte, i) => bytes[i] === byte)) {
    return 'image/png';
  }

  // "RIFF" <4-byte size> "WEBP"
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    return 'image/webp';
  }

  return null;
}

export type ArtworkValidation =
  | { ok: true; type: ArtworkMimeType }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Size and type checks for one uploaded artwork file.
 *
 * `bytes` only needs the first 12 bytes, but passing the whole file is fine.
 */
export function validateArtworkFile(file: {
  type: string;
  size: number;
  bytes: Uint8Array;
}): ArtworkValidation {
  if (!file.size || file.bytes.length === 0) {
    return { ok: false, status: 400, error: 'The file is empty.' };
  }

  if (file.size > MAX_ARTWORK_BYTES) {
    return { ok: false, status: 413, error: 'File too large. The maximum size is 10MB.' };
  }

  if (!(ALLOWED_ARTWORK_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, status: 400, error: 'Unsupported file type. Please upload a JPEG, PNG or WEBP image.' };
  }

  const detected = detectImageType(file.bytes);
  if (!detected) {
    // The browser said image/*, the bytes say otherwise.
    return { ok: false, status: 400, error: 'This file is not a valid JPEG, PNG or WEBP image.' };
  }

  return { ok: true, type: detected };
}

/**
 * The cloud name of OUR Cloudinary account, from CLOUDINARY_CLOUD_NAME or the
 * host part of CLOUDINARY_URL (cloudinary://key:secret@<cloud>). Null when
 * Cloudinary is not configured, in which case no artwork URL can be trusted.
 */
export function ourCloudinaryCloudName(): string | null {
  const direct = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (direct) return direct;

  const url = process.env.CLOUDINARY_URL?.trim();
  if (url?.startsWith('cloudinary://')) {
    const at = url.lastIndexOf('@');
    const name = at >= 0 ? url.slice(at + 1).split(/[/?#]/)[0] : '';
    return name || null;
  }

  return null;
}

/**
 * Accepts an artwork URL only if it is an image in OUR cloud under
 * custom-cards/<userId>/, and returns its Cloudinary public id. Returns null
 * for anything else - another cloud, another customer's folder, another host,
 * a path that tries to climb out with "..", or a non-https URL.
 *
 * Expected shape:
 *   https://res.cloudinary.com/<cloud>/image/upload/[v<digits>/]custom-cards/<userId>/<name>.<ext>
 */
export function parseOwnArtworkUrl(
  rawUrl: unknown,
  userId: string,
  cloudName: string | null
): { url: string; publicId: string } | null {
  return parseOwnUploadUrl(rawUrl, userId, cloudName, 'artwork');
}

/**
 * The same ownership check for any checkout upload: OUR cloud, THIS customer,
 * and the folder for THIS purpose (custom-cards/ or profile-photos/).
 */
export function parseOwnUploadUrl(
  rawUrl: unknown,
  userId: string,
  cloudName: string | null,
  purpose: UploadPurpose
): { url: string; publicId: string } | null {
  if (typeof rawUrl !== 'string' || !rawUrl || !cloudName || !userId) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
  if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;

  const prefix = `/${cloudName}/image/upload/`;
  if (!parsed.pathname.startsWith(prefix)) return null;

  // new URL() already resolved any "/../", so this is the real path; still
  // refuse encoded traversal and backslashes outright.
  let rest = parsed.pathname.slice(prefix.length);
  if (/%2e|%2f|%5c|\\/i.test(rest) || rest.split('/').includes('..')) return null;

  // Optional version segment.
  rest = rest.replace(/^v\d+\//, '');

  const folder = `${uploadFolder(purpose, userId)}/`;
  if (!rest.startsWith(folder)) return null;

  const fileName = rest.slice(folder.length);
  // Exactly one file directly inside the customer's folder, with an image extension.
  if (!/^[A-Za-z0-9_-]+\.(jpe?g|png|webp)$/i.test(fileName)) return null;

  const publicId = `${folder}${fileName.replace(/\.[^.]+$/, '')}`;
  return { url: parsed.toString(), publicId };
}

/** The custom-design fields written onto an Order. All null for other products. */
export interface CustomDesignOrderFields {
  designFee: number | null;
  customFrontImageUrl: string | null;
  customBackImageUrl: string | null;
  customFrontPublicId: string | null;
  customBackPublicId: string | null;
}

const NO_CUSTOM_DESIGN: CustomDesignOrderFields = {
  designFee: null,
  customFrontImageUrl: null,
  customBackImageUrl: null,
  customFrontPublicId: null,
  customBackPublicId: null,
};

/**
 * What POST /api/orders saves for the artwork, or why it refuses.
 *
 * - A regular product: no artwork is stored, whatever the body contains.
 * - A custom-design product: BOTH images are required, and each must be this
 *   customer's own upload (parseOwnArtworkUrl). The fee comes from the
 *   product row, never from the request.
 */
export function resolveCustomDesignOrder(input: {
  product: { isCustomDesign: boolean; designFee: number };
  frontUrl: unknown;
  backUrl: unknown;
  userId: string;
  cloudName: string | null;
}):
  | { ok: true; fields: CustomDesignOrderFields }
  | { ok: false; error: string } {
  if (!input.product.isCustomDesign) {
    return { ok: true, fields: NO_CUSTOM_DESIGN };
  }

  if (!input.frontUrl || !input.backUrl) {
    return { ok: false, error: 'Please upload both the front and the back of your card.' };
  }

  const front = parseOwnArtworkUrl(input.frontUrl, input.userId, input.cloudName);
  const back = parseOwnArtworkUrl(input.backUrl, input.userId, input.cloudName);
  if (!front || !back) {
    return {
      ok: false,
      error: 'Your card artwork could not be verified. Please upload the front and back again.',
    };
  }

  return {
    ok: true,
    fields: {
      designFee: input.product.designFee,
      customFrontImageUrl: front.url,
      customBackImageUrl: back.url,
      customFrontPublicId: front.publicId,
      customBackPublicId: back.publicId,
    },
  };
}

/**
 * The profile photo for POST /api/orders. Optional for every product - no URL
 * means no photo. A URL that is sent must be this customer's own upload in
 * profile-photos/<userId>/; anything else is refused rather than silently
 * dropped, so a broken upload is noticed at checkout, not after printing.
 */
export function resolveProfilePhoto(input: {
  url: unknown;
  userId: string;
  cloudName: string | null;
}):
  | { ok: true; fields: { profileImageUrl: string | null; profileImagePublicId: string | null } }
  | { ok: false; error: string } {
  if (input.url === undefined || input.url === null || input.url === '') {
    return { ok: true, fields: { profileImageUrl: null, profileImagePublicId: null } };
  }

  const photo = parseOwnUploadUrl(input.url, input.userId, input.cloudName, 'profile');
  if (!photo) {
    return {
      ok: false,
      error: 'Your profile photo could not be verified. Please upload it again.',
    };
  }

  return { ok: true, fields: { profileImageUrl: photo.url, profileImagePublicId: photo.publicId } };
}
