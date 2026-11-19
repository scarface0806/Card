/**
 * Cloudinary delivery-URL helpers. Client-safe: pure string work, no SDK.
 *
 * A Cloudinary image URL is .../image/upload/[transformations/][v123/]<public_id>.<ext>,
 * and a transformation is applied by inserting it right after "/upload/". The
 * original file is untouched; Cloudinary derives and caches the variant.
 */

const UPLOAD_SEGMENT = '/image/upload/';

/** Insert a transformation, e.g. "c_limit,w_400". Non-Cloudinary URLs are returned unchanged. */
export function cloudinaryTransform(url: string, transformation: string): string {
  const at = url.indexOf(UPLOAD_SEGMENT);
  if (at < 0 || !url.includes('res.cloudinary.com')) return url;
  const head = url.slice(0, at + UPLOAD_SEGMENT.length);
  const tail = url.slice(at + UPLOAD_SEGMENT.length);
  return `${head}${transformation}/${tail}`;
}

/** A small preview for lists and admin panels. */
export function cloudinaryThumbnail(url: string, width = 480): string {
  return cloudinaryTransform(url, `c_limit,w_${width},q_auto,f_auto`);
}

/**
 * A link that downloads the ORIGINAL file (fl_attachment) instead of opening
 * it, saved as `<fileName>.<ext>`. Only letters, digits, - and _ are kept in
 * the name, which is what fl_attachment accepts.
 */
export function cloudinaryDownload(url: string, fileName: string): string {
  const safe = fileName.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'artwork';
  return cloudinaryTransform(url, `fl_attachment:${safe}`);
}
