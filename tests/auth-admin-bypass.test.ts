import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * The two ways an ADMIN session could be obtained without /admin/login:
 * the customer login with an admin's password, and Google sign-in on the
 * admin's address. proxy.ts and withAdmin trust any token whose role is ADMIN,
 * so the fix is that neither route mints one. Prisma, next-auth and guest-order
 * attachment are mocked; passwords are real bcrypt hashes.
 */

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';

const PASSWORD = 'Correct-horse-9';
const HASH = bcrypt.hashSync(PASSWORD, 4);

type Row = {
  id: string;
  email: string;
  password: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  name: string | null;
  avatar: string | null;
};

const users: Record<string, Row> = {
  'admin@tapvyo.in': { id: 'a1', email: 'admin@tapvyo.in', password: HASH, role: 'ADMIN', isActive: true, name: 'Admin', avatar: 'x' },
  'buyer@example.com': { id: 'c1', email: 'buyer@example.com', password: HASH, role: 'CUSTOMER', isActive: true, name: 'Buyer', avatar: 'x' },
};

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) => users[where.email] ?? null),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

let googleEmail: string | null = null;
vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => (googleEmail ? { email: googleEmail, name: 'G', picture: null } : null)),
}));

const attachGuestOrders = vi.fn(async () => 0);
vi.mock('@/lib/guest-orders', () => ({
  attachGuestOrders: (...args: unknown[]) => attachGuestOrders(...(args as [])),
}));

const { POST: login } = await import('../app/api/auth/login/route');
const { GET: googleComplete } = await import('../app/api/auth/google-complete/route');
const { NextRequest } = await import('next/server');

let ip = 0;
function loginRequest(email: string, password: string) {
  // A fresh IP per request so the in-memory login rate limit never interferes.
  ip += 1;
  return login(
    new NextRequest('https://tapvyo.in/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': `198.51.100.${ip}` },
      body: JSON.stringify({ email, password }),
    })
  );
}

beforeEach(() => {
  googleEmail = null;
  attachGuestOrders.mockClear();
});

describe('POST /api/auth/login', () => {
  it('refuses valid ADMIN credentials with 403 and issues no token', async () => {
    const res = await loginRequest('admin@tapvyo.in', PASSWORD);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toMatchObject({
      error: 'Admin accounts must sign in at /admin/login',
      redirect: '/admin/login',
    });
    expect(body.token).toBeUndefined();
    expect(res.cookies.get('auth-token')).toBeUndefined();
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('still signs in a CUSTOMER, with a CUSTOMER token', async () => {
    const res = await loginRequest('buyer@example.com', PASSWORD);

    expect(res.status).toBe(200);
    const cookie = res.cookies.get('auth-token')?.value;
    expect(cookie).toBeTruthy();
    const payload = jwt.verify(cookie!, 'test-jwt-secret') as { role: string; userId: string };
    expect(payload).toMatchObject({ role: 'CUSTOMER', userId: 'c1' });
  });

  it('gives a wrong password on an ADMIN email the same response as on a customer email', async () => {
    const adminRes = await loginRequest('admin@tapvyo.in', 'wrong-password');
    const customerRes = await loginRequest('buyer@example.com', 'wrong-password');

    expect(adminRes.status).toBe(401);
    expect(customerRes.status).toBe(401);
    // Identical bodies: nothing reveals that the first address is an admin.
    expect(await adminRes.json()).toEqual(await customerRes.json());
    expect(adminRes.headers.get('set-cookie')).toBeNull();
  });
});

describe('GET /api/auth/google-complete', () => {
  function googleRequest() {
    return googleComplete(new NextRequest('https://tapvyo.in/api/auth/google-complete'));
  }

  it('sends an ADMIN to /admin/login with no auth-token cookie', async () => {
    googleEmail = 'admin@tapvyo.in';
    const res = await googleRequest();

    expect([302, 303, 307, 308]).toContain(res.status);
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/admin/login');
    expect(location.searchParams.get('error')).toBe('use-password');
    expect(res.cookies.get('auth-token')).toBeUndefined();
    expect(attachGuestOrders).not.toHaveBeenCalled();
  });

  it('still signs in a CUSTOMER with a CUSTOMER token', async () => {
    googleEmail = 'buyer@example.com';
    const res = await googleRequest();

    const cookie = res.cookies.get('auth-token')?.value;
    expect(cookie).toBeTruthy();
    expect((jwt.verify(cookie!, 'test-jwt-secret') as { role: string }).role).toBe('CUSTOMER');
  });
});
