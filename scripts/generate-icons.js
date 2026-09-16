/**
 * Regenerates the Tapvyo icon set from public/logo.png.
 * Run from the repo root:  node <this file>
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = process.argv[2] || process.cwd();
const SOURCE = path.join(ROOT, 'public/logo.png');

/** Square PNG at `size`, transparent background. */
const square = (size) =>
  sharp(SOURCE).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' });

/** Raw BGRA pixels, top-down, for the ICO encoder. */
async function bgra(size) {
  const { data } = await square(size).raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4 + 0] = data[i * 4 + 2]; // B
    out[i * 4 + 1] = data[i * 4 + 1]; // G
    out[i * 4 + 2] = data[i * 4 + 0]; // R
    out[i * 4 + 3] = data[i * 4 + 3]; // A
  }
  return out;
}

/**
 * One ICO image: a BITMAPINFOHEADER, the XOR pixel data bottom-up, then a
 * zeroed AND mask. 32bpp DIB entries are what every browser back to IE has
 * read reliably — the alpha channel does the transparency, the AND mask is
 * vestigial but structurally required.
 */
function dib(size, pixels) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0); // biSize
  header.writeInt32LE(size, 4); // biWidth
  header.writeInt32LE(size * 2, 8); // biHeight — XOR + AND stacked
  header.writeUInt16LE(1, 12); // biPlanes
  header.writeUInt16LE(32, 14); // biBitCount

  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    pixels.copy(xor, y * size * 4, (size - 1 - y) * size * 4, (size - y) * size * 4);
  }

  const maskRow = Math.ceil(size / 8 / 4) * 4; // rows pad to 4 bytes
  const mask = Buffer.alloc(maskRow * size); // all zero = "use the alpha"

  header.writeUInt32LE(xor.length + mask.length, 20); // biSizeImage
  return Buffer.concat([header, xor, mask]);
}

async function ico(sizes, dest) {
  const images = [];
  for (const size of sizes) images.push(dib(size, await bgra(size)));

  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2); // 1 = icon
  dir.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const entries = sizes.map((size, i) => {
    const e = Buffer.alloc(16);
    e[0] = size === 256 ? 0 : size; // 0 means 256
    e[1] = size === 256 ? 0 : size;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bit count
    e.writeUInt32LE(images[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += images[i].length;
    return e;
  });

  fs.writeFileSync(dest, Buffer.concat([dir, ...entries, ...images]));
  return sizes;
}

(async () => {
  const pub = path.join(ROOT, 'public');

  // 512 master. logo.png is already a 416px mark centred in 512 (9.4% padding),
  // so it is copied rather than resampled — no generation loss.
  fs.copyFileSync(SOURCE, path.join(pub, 'icon.png'));

  // iOS composites any transparency onto black, which would swallow the dark
  // green in the mark. Flattened onto white, and inset a little further so the
  // logo clears the rounded-corner mask iOS applies.
  await sharp(SOURCE)
    .resize(160, 160, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(path.join(pub, 'apple-icon.png'));

  // 48 and 96 are what Google's favicon crawler wants (square, multiple of 48);
  // 16 and 32 are what browser tabs and bookmark bars actually render.
  await ico([16, 32, 48, 96], path.join(pub, 'favicon.ico'));

  // PWA sizes, from the same master.
  await square(192).png().toFile(path.join(pub, 'icon-192.png'));
  await square(512).png().toFile(path.join(pub, 'icon-512.png'));

  // Maskable icons are cropped to a circle inscribed in the middle 80%, so the
  // mark needs to sit inside that safe zone on an opaque ground.
  await sharp(SOURCE)
    .resize(360, 360, { fit: 'contain', background: { r: 7, g: 13, b: 29, alpha: 1 } })
    .extend({ top: 76, bottom: 76, left: 76, right: 76, background: { r: 7, g: 13, b: 29, alpha: 1 } })
    .flatten({ background: { r: 7, g: 13, b: 29 } })
    .png()
    .toFile(path.join(pub, 'icon-maskable-512.png'));

  for (const f of ['public/icon.png', 'public/apple-icon.png', 'public/favicon.ico', 'public/icon-192.png', 'public/icon-512.png', 'public/icon-maskable-512.png']) {
    console.log(String(fs.statSync(path.join(ROOT, f)).size).padStart(7), f);
  }
})();
