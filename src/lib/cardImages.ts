/**
 * WHERE THE BACK OF A CARD COMES FROM.
 *
 * There is no back-image column on Product, and adding one would mean changing
 * the schema and both product write paths (POST /api/products and
 * PUT /api/products/:id both do `images: [parsed.image]`, which overwrites the
 * whole array with a single element). Until that happens, the back face is
 * derived from the front image's own URL by convention:
 *
 *     /cards/elegant.png                  ->  /cards/elegant-back.png
 *     .../admin/products/abc123.jpg       ->  .../admin/products/abc123-back.jpg
 *     .../admin/products/abc123           ->  .../admin/products/abc123-back
 *
 * `-back` is inserted before the file extension, or appended when there is no
 * extension (Cloudinary delivery URLs are often extension-less). Query strings
 * and hashes are preserved.
 *
 * ---------------------------------------------------------------------------
 * THIS IS THE ONE PLACE TO CHANGE.
 *
 * When a real field exists, delete the derivation below and return it:
 *
 *     export function resolveCardBackImage(front, explicitBack) {
 *       return explicitBack?.trim() || null;
 *     }
 *
 * Nothing else needs editing - every flip surface calls through here.
 * ---------------------------------------------------------------------------
 */

/** File extensions the uploader accepts, plus the ones Cloudinary can serve. */
const EXTENSION = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

const BACK_SUFFIX = "-back";

/**
 * The back-face URL for a card, or `null` when there is nothing to show.
 *
 * `null` is the signal to hide the flip control entirely - the caller must
 * never render an empty face or a broken image. A URL coming back from here is
 * a *candidate*: it is not verified to exist, so the caller still has to treat
 * an `onError` on the resulting <img> as "no back face".
 *
 * @param front        The front image URL, i.e. `Product.images[0]`.
 * @param explicitBack A real back-image field, if one is ever added. Wins over
 *                     the convention whenever it is present.
 */
export function resolveCardBackImage(
  front?: string | null,
  explicitBack?: string | null
): string | null {
  // (a) A real field always wins.
  const explicit = explicitBack?.trim();
  if (explicit) return explicit;

  // (b) Otherwise derive from the front image.
  const source = front?.trim();
  if (!source) return null;

  // Inline and object URLs have no sibling to derive - there is no directory
  // to look in. Appending "-back" to a base64 payload produces a megabyte-long
  // string that is guaranteed to fail, which is how the flip control ended up
  // being offered for cards that never had a back face.
  if (/^(data:|blob:)/i.test(source)) return null;

  // Split the URL so `?v=2` / `#frag` survive the rename and are not treated
  // as part of the filename.
  const suffixStart = source.search(/[?#]/);
  const path = suffixStart === -1 ? source : source.slice(0, suffixStart);
  const tail = suffixStart === -1 ? "" : source.slice(suffixStart);

  if (!path) return null;

  // Already a back face. Deriving `foo-back-back.png` from it would only ever
  // 404, so treat it as having no further back side.
  if (path.replace(EXTENSION, "").toLowerCase().endsWith(BACK_SUFFIX)) {
    return null;
  }

  const extension = path.match(EXTENSION)?.[0];
  const withSuffix = extension
    ? `${path.slice(0, -extension.length)}${BACK_SUFFIX}${extension}`
    : `${path}${BACK_SUFFIX}`;

  return `${withSuffix}${tail}`;
}
