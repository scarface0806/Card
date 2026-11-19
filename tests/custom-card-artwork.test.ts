import { describe, expect, it } from 'vitest';

import {
  MAX_ARTWORK_BYTES,
  detectImageType,
  parseOwnArtworkUrl,
  resolveCustomDesignOrder,
  validateArtworkFile,
} from '@/lib/custom-card-artwork';

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d]);
const WEBP = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0x24, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0))));
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0, 0, 0, 0x04, 0, 0, 0]);

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WEBP from their bytes', () => {
    expect(detectImageType(JPEG)).toBe('image/jpeg');
    expect(detectImageType(PNG)).toBe('image/png');
    expect(detectImageType(WEBP)).toBe('image/webp');
  });

  it('rejects anything else', () => {
    expect(detectImageType(SVG)).toBeNull();
    expect(detectImageType(EXE)).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
});

describe('validateArtworkFile', () => {
  it('accepts a real image of an allowed type', () => {
    expect(validateArtworkFile({ type: 'image/png', size: 2048, bytes: PNG })).toEqual({
      ok: true,
      type: 'image/png',
    });
  });

  it('rejects a disallowed declared type', () => {
    const result = validateArtworkFile({ type: 'image/gif', size: 2048, bytes: JPEG });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a file whose bytes do not match an allowed image, whatever it claims to be', () => {
    expect(validateArtworkFile({ type: 'image/png', size: 2048, bytes: SVG })).toMatchObject({ ok: false, status: 400 });
    expect(validateArtworkFile({ type: 'image/jpeg', size: 2048, bytes: EXE })).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects files over 10MB with 413', () => {
    const result = validateArtworkFile({ type: 'image/jpeg', size: MAX_ARTWORK_BYTES + 1, bytes: JPEG });
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it('accepts a file of exactly 10MB', () => {
    expect(validateArtworkFile({ type: 'image/jpeg', size: MAX_ARTWORK_BYTES, bytes: JPEG }).ok).toBe(true);
  });

  it('rejects an empty file', () => {
    expect(validateArtworkFile({ type: 'image/jpeg', size: 0, bytes: new Uint8Array([]) })).toMatchObject({ ok: false });
  });
});

describe('parseOwnArtworkUrl', () => {
  const cloud = 'tapvyo';
  const user = '64b7f0c2a1b2c3d4e5f60718';
  const good = `https://res.cloudinary.com/${cloud}/image/upload/v1731999999/custom-cards/${user}/abc123xyz.jpg`;

  it("accepts an image in our cloud under the customer's own folder", () => {
    expect(parseOwnArtworkUrl(good, user, cloud)).toEqual({
      url: good,
      publicId: `custom-cards/${user}/abc123xyz`,
    });
  });

  it('accepts a URL without a version segment', () => {
    const url = `https://res.cloudinary.com/${cloud}/image/upload/custom-cards/${user}/abc.webp`;
    expect(parseOwnArtworkUrl(url, user, cloud)?.publicId).toBe(`custom-cards/${user}/abc`);
  });

  it('rejects a missing URL', () => {
    expect(parseOwnArtworkUrl(undefined, user, cloud)).toBeNull();
    expect(parseOwnArtworkUrl('', user, cloud)).toBeNull();
  });

  it('rejects a foreign host', () => {
    expect(parseOwnArtworkUrl(`https://evil.example.com/${cloud}/image/upload/custom-cards/${user}/a.jpg`, user, cloud)).toBeNull();
    expect(parseOwnArtworkUrl('https://images.unsplash.com/photo-1.jpg', user, cloud)).toBeNull();
  });

  it('rejects another Cloudinary account', () => {
    expect(parseOwnArtworkUrl(good.replace(`/${cloud}/`, '/someone-else/'), user, cloud)).toBeNull();
  });

  it("rejects another customer's folder", () => {
    expect(parseOwnArtworkUrl(good, '64b7f0c2a1b2c3d4e5f60719', cloud)).toBeNull();
  });

  it('rejects other folders in our cloud, such as admin product images', () => {
    expect(parseOwnArtworkUrl(`https://res.cloudinary.com/${cloud}/image/upload/v1/admin/products/a.jpg`, user, cloud)).toBeNull();
  });

  it('rejects path traversal, transformations and query strings', () => {
    expect(parseOwnArtworkUrl(`https://res.cloudinary.com/${cloud}/image/upload/custom-cards/${user}/%2e%2e/x.jpg`, user, cloud)).toBeNull();
    expect(parseOwnArtworkUrl(`https://res.cloudinary.com/${cloud}/image/upload/custom-cards/${user}/sub/x.jpg`, user, cloud)).toBeNull();
    expect(parseOwnArtworkUrl(`https://res.cloudinary.com/${cloud}/image/upload/w_10/custom-cards/${user}/x.jpg`, user, cloud)).toBeNull();
    expect(parseOwnArtworkUrl(`${good}?x=1`, user, cloud)).toBeNull();
  });

  it('rejects plain http and non-image files', () => {
    expect(parseOwnArtworkUrl(good.replace('https:', 'http:'), user, cloud)).toBeNull();
    expect(parseOwnArtworkUrl(good.replace('.jpg', '.svg'), user, cloud)).toBeNull();
  });

  it('trusts nothing when Cloudinary is not configured', () => {
    expect(parseOwnArtworkUrl(good, user, null)).toBeNull();
  });
});

describe('resolveCustomDesignOrder (POST /api/orders)', () => {
  const cloud = 'tapvyo';
  const user = '64b7f0c2a1b2c3d4e5f60718';
  const url = (name: string) =>
    `https://res.cloudinary.com/${cloud}/image/upload/v1/custom-cards/${user}/${name}.png`;
  const custom = { isCustomDesign: true, designFee: 100 };

  it('saves both images and the fee from the product for a custom design', () => {
    const result = resolveCustomDesignOrder({
      product: custom,
      frontUrl: url('front1'),
      backUrl: url('back1'),
      userId: user,
      cloudName: cloud,
    });
    expect(result).toEqual({
      ok: true,
      fields: {
        designFee: 100,
        customFrontImageUrl: url('front1'),
        customBackImageUrl: url('back1'),
        customFrontPublicId: `custom-cards/${user}/front1`,
        customBackPublicId: `custom-cards/${user}/back1`,
      },
    });
  });

  it('rejects a missing front or back image', () => {
    for (const [frontUrl, backUrl] of [
      [undefined, url('b')],
      [url('f'), undefined],
      ['', ''],
    ]) {
      const result = resolveCustomDesignOrder({ product: custom, frontUrl, backUrl, userId: user, cloudName: cloud });
      expect(result.ok).toBe(false);
    }
  });

  it('rejects a foreign or another customer\'s image URL', () => {
    const foreign = resolveCustomDesignOrder({
      product: custom,
      frontUrl: 'https://evil.example.com/front.png',
      backUrl: url('b'),
      userId: user,
      cloudName: cloud,
    });
    expect(foreign.ok).toBe(false);

    const someoneElses = resolveCustomDesignOrder({
      product: custom,
      frontUrl: url('f'),
      backUrl: url('b'),
      userId: '64b7f0c2a1b2c3d4e5f60719',
      cloudName: cloud,
    });
    expect(someoneElses.ok).toBe(false);
  });

  it('stores no artwork and no fee for a regular product, whatever the body says', () => {
    const result = resolveCustomDesignOrder({
      product: { isCustomDesign: false, designFee: 0 },
      frontUrl: 'https://evil.example.com/front.png',
      backUrl: undefined,
      userId: user,
      cloudName: cloud,
    });
    expect(result).toEqual({
      ok: true,
      fields: {
        designFee: null,
        customFrontImageUrl: null,
        customBackImageUrl: null,
        customFrontPublicId: null,
        customBackPublicId: null,
      },
    });
  });
});
