import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Step 8 - who may change an order's status through PUT /api/orders/:id.
 *
 * The bug: PUT let an order's OWNER set any status on it (an unpaid order
 * straight to CONFIRMED / DELIVERED, or a SHIPPED order back to PENDING).
 * Now a customer may only cancel their own PENDING, unpaid order; admins are
 * unchanged.
 *
 * Real: the route handlers (PUT/GET/PATCH in app/api/orders/[id], PATCH in
 * app/api/admin/orders/[id]), authenticate() with real JWTs, the 2FA guard.
 * Fake: Prisma - an in-memory order store whose updateMany honours the
 * compound where (id, userId, status, paymentStatus { not }); prisma.card is
 * a spy so card auto-create can be asserted; MongoDB finds nothing (so PATCH
 * takes its Prisma path); the email senders are stubs.
 */

process.env.JWT_SECRET = 'test-jwt-secret-step8';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const;
type Status = (typeof STATUSES)[number];
type PayStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

const REFUSED = 'You are not allowed to change this order to that status';
const ORDER_ID = '64b7f0c2a1b2c3d4e5f60718';
const OTHER_ORDER_ID = '64b7f0c2a1b2c3d4e5f60719';
const CUSTOMER_A = 'cust-a';
const CUSTOMER_B = 'cust-b';
const ADMIN_ID = 'admin-1';

type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: Status;
  paymentStatus: PayStatus;
  cardId: string | null;
  nfcLinkEmailSent: boolean;
  printingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  guestEmail: string | null;
};

const USERS: Record<string, { id: string; name: string; email: string }> = {
  [CUSTOMER_A]: { id: CUSTOMER_A, name: 'Asha Kumar', email: 'a@example.com' },
  [CUSTOMER_B]: { id: CUSTOMER_B, name: 'Bala Ravi', email: 'b@example.com' },
};

let orders: Map<string, Order>;

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    orderNumber: 'TV-1001',
    userId: CUSTOMER_A,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    cardId: null,
    nfcLinkEmailSent: false,
    printingAt: null,
    shippedAt: null,
    deliveredAt: null,
    guestEmail: null,
    ...overrides,
  };
}

function withUser(o: Order, include?: { user?: unknown }) {
  const copy: Record<string, unknown> = structuredClone(o);
  if (include?.user) copy.user = o.userId ? { ...USERS[o.userId] } : null;
  return copy;
}

// ---- fakes ------------------------------------------------------------------------
const cardCreate = vi.fn(async ({ data }: { data: { slug: string } }) => ({ id: 'card-1', slug: data.slug }));

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(async ({ where, include }: { where: { id: string }; include?: { user?: unknown } }) => {
        const o = orders.get(where.id);
        return o ? withUser(o, include) : null;
      }),
      update: vi.fn(async ({ where, data, include }: { where: { id: string }; data: Partial<Order>; include?: { user?: unknown } }) => {
        const o = orders.get(where.id);
        if (!o) throw new Error('Record to update not found.');
        Object.assign(o, data);
        return withUser(o, include);
      }),
      updateMany: vi.fn(async ({ where, data }: {
        where: { id: string; userId?: string; status?: Status; paymentStatus?: { not: PayStatus } };
        data: Partial<Order>;
      }) => {
        const o = orders.get(where.id);
        if (!o) return { count: 0 };
        if (where.userId !== undefined && o.userId !== where.userId) return { count: 0 };
        if (where.status !== undefined && o.status !== where.status) return { count: 0 };
        if (where.paymentStatus && o.paymentStatus === where.paymentStatus.not) return { count: 0 };
        Object.assign(o, data);
        return { count: 1 };
      }),
    },
    card: {
      findUnique: vi.fn(async () => null),
      create: (args: { data: { slug: string } }) => cardCreate(args),
    },
  },
}));

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => ({
    collection: () => ({ findOne: async () => null, findOneAndUpdate: async () => null, deleteOne: async () => ({ deletedCount: 0 }) }),
  })),
}));
vi.mock('@/lib/emails/send-order-email', () => ({ sendOrderStatusEmail: vi.fn(async () => undefined) }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(async () => true) }));

const { generateToken } = await import('@/lib/auth');
const orderRoute = await import('../app/api/orders/[id]/route');
const adminOrderRoute = await import('../app/api/admin/orders/[id]/route');
const { NextRequest } = await import('next/server');

// ---- helpers ------------------------------------------------------------------------------
const tokenFor = (userId: string, role: 'ADMIN' | 'CUSTOMER') =>
  generateToken({ userId, email: `${userId}@example.com`, role: role as never });
const customerA = () => tokenFor(CUSTOMER_A, 'CUSTOMER');
const customerB = () => tokenFor(CUSTOMER_B, 'CUSTOMER');
const admin = () => tokenFor(ADMIN_ID, 'ADMIN');

let ip = 0;
function req(method: string, path: string, opts: { token?: string; body?: unknown; raw?: string } = {}) {
  const headers: Record<string, string> = { 'x-forwarded-for': `203.0.113.${++ip % 250}` };
  if (opts.token) headers.cookie = `auth-token=${opts.token}`;
  let body: string | undefined;
  if (opts.raw !== undefined) body = opts.raw;
  else if (opts.body !== undefined) body = JSON.stringify(opts.body);
  if (body !== undefined) headers['content-type'] = 'application/json';
  return new NextRequest(`https://tapvyo.in${path}`, { method, headers, body });
}
const ctx = (id = ORDER_ID) => ({ params: Promise.resolve({ id }) });

async function put(token: string | undefined, body: unknown, id = ORDER_ID) {
  const res = await orderRoute.PUT(req('PUT', `/api/orders/${id}`, { token, body }), ctx(id));
  return { status: res.status, body: await res.json() };
}

const snapshot = () => structuredClone([...orders.values()]);

beforeEach(() => {
  orders = new Map([[ORDER_ID, makeOrder()]]);
  cardCreate.mockClear();
  delete process.env.ADMIN_2FA_REQUIRED;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ---- customer: refused ---------------------------------------------------------------------------
describe('customer PUT on their own PENDING order', () => {
  it.each(['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'COMPLETED', 'PENDING'])(
    'cannot set %s -> 403, nothing changes, no card created',
    async (status) => {
      const before = snapshot();
      const r = await put(customerA(), { status });
      expect(r.status).toBe(403);
      expect(r.body.message).toBe(REFUSED);
      expect(snapshot()).toEqual(before);
      expect(cardCreate).not.toHaveBeenCalled();
    }
  );

  it('the refusal never lists the statuses, even for junk input', async () => {
    for (const body of [{ status: 'NOPE' }, { status: 42 }, {}, { foo: 'bar' }]) {
      const r = await put(customerA(), body);
      expect(r.status).toBe(403);
      expect(r.body.message).toBe(REFUSED);
      expect(JSON.stringify(r.body)).not.toMatch(/CONFIRMED|PROCESSING|SHIPPED|DELIVERED|REFUNDED/);
    }
  });
});

// ---- customer: allowed --------------------------------------------------------------------------------
describe('customer cancel', () => {
  it('can cancel their own PENDING, unpaid order -> 200, same body keys as before', async () => {
    const r = await put(customerA(), { status: 'CANCELLED' });
    expect(r.status).toBe(200);
    expect(Object.keys(r.body).sort()).toEqual(['data', 'message', 'order', 'success']);
    expect(r.body.success).toBe(true);
    expect(r.body.message).toBe('Order updated successfully');
    expect(r.body.order).toMatchObject({ id: ORDER_ID, status: 'CANCELLED', user: USERS[CUSTOMER_A] });
    expect(orders.get(ORDER_ID)!.status).toBe('CANCELLED');
    expect(cardCreate).not.toHaveBeenCalled();
  });

  it('a FAILED payment still counts as unpaid', async () => {
    orders.set(ORDER_ID, makeOrder({ paymentStatus: 'FAILED' }));
    expect((await put(customerA(), { status: 'CANCELLED' })).status).toBe(200);
  });

  it('cannot cancel a PAID order, even while still PENDING -> 403, unchanged', async () => {
    orders.set(ORDER_ID, makeOrder({ paymentStatus: 'PAID' }));
    const before = snapshot();
    const r = await put(customerA(), { status: 'CANCELLED' });
    expect(r.status).toBe(403);
    expect(r.body.message).toBe(REFUSED);
    expect(snapshot()).toEqual(before);
  });

  it.each(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED', 'CANCELLED'] as Status[])(
    'cannot cancel an order that is already %s -> 403, unchanged',
    async (status) => {
      orders.set(ORDER_ID, makeOrder({ status, paymentStatus: status === 'REFUNDED' ? 'REFUNDED' : 'PAID' }));
      const before = snapshot();
      const r = await put(customerA(), { status: 'CANCELLED' });
      expect(r.status).toBe(403);
      expect(snapshot()).toEqual(before);
    }
  );

  it("cannot touch another customer's order -> 403 Access denied (unchanged)", async () => {
    const before = snapshot();
    const r = await put(customerB(), { status: 'CANCELLED' });
    expect(r.status).toBe(403);
    expect(r.body.message).toBe('Access denied');
    expect(snapshot()).toEqual(before);
  });

  it('a payment landing between the read and the write wins: the cancel is refused', async () => {
    const prisma = (await import('@/lib/prisma')).default as unknown as {
      order: { findUnique: (args: unknown) => Promise<unknown> };
    };
    const realFind = prisma.order.findUnique;
    // The handler reads a PENDING, unpaid order; payment is verified right after.
    vi.spyOn(prisma.order, 'findUnique').mockImplementationOnce(async (args) => {
      const seen = await realFind(args);
      orders.get(ORDER_ID)!.paymentStatus = 'PAID';
      return seen;
    });
    const r = await put(customerA(), { status: 'CANCELLED' });
    expect(r.status).toBe(403);
    expect(orders.get(ORDER_ID)).toMatchObject({ status: 'PENDING', paymentStatus: 'PAID' });
  });
});

describe('customer cannot walk a fulfilled order backwards', () => {
  it.each((['SHIPPED', 'DELIVERED'] as Status[]).flatMap((from) =>
    (['PENDING', 'CANCELLED', 'REFUNDED'] as Status[]).map((to) => [from, to] as const)
  ))('%s -> %s is 403, unchanged', async (from, to) => {
    orders.set(ORDER_ID, makeOrder({ status: from, paymentStatus: 'PAID' }));
    const before = snapshot();
    const r = await put(customerA(), { status: to });
    expect(r.status).toBe(403);
    expect(r.body.message).toBe(REFUSED);
    expect(snapshot()).toEqual(before);
  });
});

// ---- admin: unchanged --------------------------------------------------------------------------------------
describe('admin PUT is unchanged', () => {
  it.each(STATUSES.flatMap((from) => STATUSES.map((to) => [from, to] as const)))(
    '%s -> %s is 200',
    async (from, to) => {
      orders.set(ORDER_ID, makeOrder({ status: from, paymentStatus: 'PAID' }));
      const r = await put(admin(), { status: to });
      expect(r.status).toBe(200);
      expect(r.body.message).toBe('Order updated successfully');
      expect(r.body.order).toMatchObject({ status: to, user: USERS[CUSTOMER_A] });
      expect(orders.get(ORDER_ID)!.status).toBe(to);
      // PUT never had side effects; it still has none.
      expect(cardCreate).not.toHaveBeenCalled();
    }
  );

  it('an invalid status is still 400 with the validation message, before the order lookup', async () => {
    const r = await put(admin(), { status: 'BOGUS' }, OTHER_ORDER_ID);
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/PENDING/);
  });

  it('a missing order is still 404', async () => {
    expect((await put(admin(), { status: 'CONFIRMED' }, OTHER_ORDER_ID)).status).toBe(404);
  });
});

// ---- signed out --------------------------------------------------------------------------------------------------
describe('signed-out PUT', () => {
  it('is 401 for an existing order, a missing order, and a malformed body', async () => {
    const before = snapshot();
    expect((await put(undefined, { status: 'CANCELLED' })).status).toBe(401);
    expect((await put(undefined, { status: 'CANCELLED' }, OTHER_ORDER_ID)).status).toBe(401);
    expect((await put(undefined, { status: 'BOGUS' })).status).toBe(401);
    const raw = await orderRoute.PUT(req('PUT', `/api/orders/${ORDER_ID}`, { raw: '{not json' }), ctx());
    expect(raw.status).toBe(401);
    expect(snapshot()).toEqual(before);
  });
});

// ---- regressions ------------------------------------------------------------------------------------------------------
describe('regressions', () => {
  it('GET /api/orders/:id still returns the order to its owner, and 403 to someone else', async () => {
    const own = await orderRoute.GET(req('GET', `/api/orders/${ORDER_ID}`, { token: customerA() }), ctx());
    expect(own.status).toBe(200);
    expect((await own.json()).order).toMatchObject({ id: ORDER_ID, userId: CUSTOMER_A });
    const other = await orderRoute.GET(req('GET', `/api/orders/${ORDER_ID}`, { token: customerB() }), ctx());
    expect(other.status).toBe(403);
  });

  it('PATCH /api/orders/:id is still admin-only and still follows its transition rules', async () => {
    const cust = await orderRoute.PATCH(req('PATCH', `/api/orders/${ORDER_ID}`, { token: customerA(), body: { status: 'accepted' } }), ctx());
    expect(cust.status).toBe(403);
    expect(orders.get(ORDER_ID)!.status).toBe('PENDING');

    const ok = await orderRoute.PATCH(req('PATCH', `/api/orders/${ORDER_ID}`, { token: admin(), body: { status: 'accepted' } }), ctx());
    expect(ok.status).toBe(200);
    expect((await ok.json()).message).toBe('Order accepted');
    expect(orders.get(ORDER_ID)!.status).toBe('CONFIRMED');

    const skip = await orderRoute.PATCH(req('PATCH', `/api/orders/${ORDER_ID}`, { token: admin(), body: { status: 'SHIPPED' } }), ctx());
    expect(skip.status).toBe(400);
    expect(orders.get(ORDER_ID)!.status).toBe('CONFIRMED');
  });

  it('admin PATCH /api/admin/orders/:id CONFIRMED still auto-creates the card', async () => {
    const res = await adminOrderRoute.PATCH(req('PATCH', `/api/admin/orders/${ORDER_ID}`, { token: admin(), body: { status: 'CONFIRMED' } }));
    expect(res.status).toBe(200);
    expect(cardCreate).toHaveBeenCalledTimes(1);
    expect(orders.get(ORDER_ID)).toMatchObject({ status: 'CONFIRMED', cardId: 'card-1' });
  });

  it('admin PATCH /api/admin/orders/:id is still refused to a customer, and creates no card', async () => {
    const res = await adminOrderRoute.PATCH(req('PATCH', `/api/admin/orders/${ORDER_ID}`, { token: customerA(), body: { status: 'CONFIRMED' } }));
    expect(res.status).toBe(403);
    expect(cardCreate).not.toHaveBeenCalled();
    expect(orders.get(ORDER_ID)!.status).toBe('PENDING');
  });
});
