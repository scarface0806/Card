import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * POST /api/uploads/custom-card - route-level checks. Auth, the shared rate
 * limiter and Cloudinary are mocked; their own behaviour is tested elsewhere.
 * What matters here is the order of refusals and that only a real, small
 * enough JPEG/PNG/WEBP ever reaches Cloudinary, in the caller's own folder.
 */

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';
let signedIn = true;
let limiter: 'allow' | 'block' | 'unavailable' = 'allow';

vi.mock('@/lib/auth-middleware', () => ({
  authenticate: vi.fn(async () =>
    signedIn ? { user: { id: USER_ID, email: 'a@b.c', role: 'CUSTOMER' }, error: null } : { user: null, error: 'No token' }
  ),
}));

class FakeUnavailable extends Error {}

vi.mock('@/lib/mongo-rate-limit', () => ({
  MongoRateLimitUnavailableError: FakeUnavailable,
  consumeRateLimit: vi.fn(async () => {
    if (limiter === 'unavailable') throw new FakeUnavailable('down');
    if (limiter === 'block') return { ok: false, retryAfter: 120 };
    return { ok: true };
  }),
}));

const uploadToCloudinary = vi.fn(async (_buffer: Buffer, folder: string) => ({
  url: `https://res.cloudinary.com/tapvyo/image/upload/v1/${folder}/abc.jpg`,
  publicId: `${folder}/abc`,
  width: 1011,
  height: 638,
}));

vi.mock('@/lib/cloudinary', () => ({
  isCloudinaryConfigured: () => true,
  uploadToCloudinary: (buffer: Buffer, folder: string) => uploadToCloudinary(buffer, folder),
}));

const { POST } = await import('../app/api/uploads/custom-card/route');

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1];

function upload(file: File | null, purpose?: string) {
  const form = new FormData();
  if (file) form.append('file', file);
  if (purpose !== undefined) form.append('purpose', purpose);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return POST(new Request('https://tapvyo.in/api/uploads/custom-card', { method: 'POST', body: form }) as any);
}

beforeEach(() => {
  signedIn = true;
  limiter = 'allow';
  uploadToCloudinary.mockClear();
});

describe('POST /api/uploads/custom-card', () => {
  it('uploads a valid JPEG into the customer folder', async () => {
    const res = await upload(new File([new Uint8Array(JPEG_HEADER)], 'front.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ publicId: `custom-cards/${USER_ID}/abc`, width: 1011, height: 638 });
    expect(uploadToCloudinary).toHaveBeenCalledWith(expect.any(Buffer), `custom-cards/${USER_ID}`);
  });

  it('stores a profile photo in the customer profile-photos folder', async () => {
    const res = await upload(new File([new Uint8Array(JPEG_HEADER)], 'me.jpg', { type: 'image/jpeg' }), 'profile');
    expect(res.status).toBe(200);
    expect(uploadToCloudinary).toHaveBeenCalledWith(expect.any(Buffer), `profile-photos/${USER_ID}`);
  });

  it('rejects an unknown purpose rather than picking a folder from it', async () => {
    const res = await upload(new File([new Uint8Array(JPEG_HEADER)], 'x.jpg', { type: 'image/jpeg' }), 'admin/products');
    expect(res.status).toBe(400);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  it('requires login', async () => {
    signedIn = false;
    const res = await upload(new File([new Uint8Array(JPEG_HEADER)], 'front.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(401);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects a disallowed type', async () => {
    const res = await upload(new File(['GIF89a'], 'a.gif', { type: 'image/gif' }));
    expect(res.status).toBe(400);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects a non-image disguised as a PNG', async () => {
    const res = await upload(new File(['<svg><script>alert(1)</script></svg>'], 'a.png', { type: 'image/png' }));
    expect(res.status).toBe(400);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects a file over 10MB', async () => {
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    big.set(JPEG_HEADER);
    const res = await upload(new File([big], 'big.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(413);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects a request with no file', async () => {
    expect((await upload(null)).status).toBe(400);
  });

  it('refuses when the per-user limit is spent', async () => {
    limiter = 'block';
    const res = await upload(new File([new Uint8Array(JPEG_HEADER)], 'front.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
  });

  it('fails closed when the limiter is unavailable', async () => {
    limiter = 'unavailable';
    const res = await upload(new File([new Uint8Array(JPEG_HEADER)], 'front.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(503);
    expect(uploadToCloudinary).not.toHaveBeenCalled();
  });
});
