import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Step 9 - order state vs. money.
 *
 *  - POST /api/admin/profiles: only a PAID order at CONFIRMED or later gets a
 *    profile, and only one (Order.cardId is the link).
 *  - createPaymentOrder: a CANCELLED / REFUNDED order cannot START a payment
 *    (no PaymentLog, no Razorpay order).
 *  - verifyPayment / UPI check: unchanged (Option A) - money already captured
 *    is always recorded, even on a cancelled order, so it can be refunded.
 *  - PATCH /api/admin/orders/:id CONFIRMED: the card and NFC email only for a
 *    paid order; the status change itself still succeeds.
 *
 * Real: route handlers, withAdmin()/authenticate() with real JWTs, the payment
 * adapter, RazorpayService.verifyPaymentSignature (real HMAC with a test
 * secret). Stubbed: Prisma (in-memory), the two Razorpay network calls, email.
 */

const TEST_KEY_SECRET = 'unit_test_secret_not_a_real_key';
process.env.RAZORPAY_KEY_ID = 'test_key_id_placeholder_not_real';
process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
process.env.JWT_SECRET = 'test-jwt-secret-step9';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
type PayStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PayStatus;
  paymentId: string | null;
  paymentMethod: string | null;
  paidAt: Date | null;
  cardId?: string | null;
  nfcLinkEmailSent: boolean;
  total: number;
  items: unknown[];
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  printingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
};

const ORDER_ID = '507f1f77bcf86cd799439011';
const CUSTOMER_ID = '507f1f77bcf86cd799439022';
const ADMIN_ID = '507f1f77bcf86cd799439033';
const USER = { id: CUSTOMER_ID, name: 'Asha Kumar', email: 'asha@example.com', phone: '9876543210' };

const db = {
  orders: [] as Order[],
  cards: [] as { id: string; slug: string; userId: string | null }[],
  paymentLogs: [] as Record<string, unknown>[],
};
let cardSeq = 0;

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    orderNumber: 'TV-2001',
    userId: CUSTOMER_ID,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentId: null,
    paymentMethod: null,
    paidAt: null,
    cardId: null,
    nfcLinkEmailSent: false,
    total: 599,
    items: [],
    guestEmail: null,
    guestName: null,
    guestPhone: null,
    printingAt: null,
    shippedAt: null,
    deliveredAt: null,
    ...overrides,
  };
}

const order = () => db.orders[0];
const withUser = (o: Order, include?: { user?: unknown }) =>
  include?.user ? { ...structuredClone(o), user: o.userId ? { ...USER } : null } : structuredClone(o);

// ---- Prisma stand-in -----------------------------------------------------------------
const cardCreate = vi.fn(async ({ data }: { data: { slug: string; userId: string | null } }) => {
  const card = { id: `card-${++cardSeq}`, slug: data.slug, userId: data.userId };
  db.cards.push(card);
  return { id: card.id, slug: card.slug };
});

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(async ({ where, include }: { where: { id: string }; include?: { user?: unknown } }) => {
        const o = db.orders.find((x) => x.id === where.id);
        return o ? withUser(o, include) : null;
      }),
      update: vi.fn(async ({ where, data, include }: { where: { id: string }; data: Partial<Order>; include?: { user?: unknown } }) => {
        const o = db.orders.find((x) => x.id === where.id);
        if (!o) throw new Error('Record to update not found.');
        Object.assign(o, data);
        return withUser(o, include);
      }),
      updateMany: vi.fn(async ({ where, data }: {
        where: { id: string; paymentStatus?: { not: PayStatus }; OR?: Record<string, unknown>[] };
        data: Partial<Order>;
      }) => {
        const matched = db.orders.filter((o) => {
          if (o.id !== where.id) return false;
          if (where.paymentStatus && o.paymentStatus === where.paymentStatus.not) return false;
          if (where.OR) {
            // cardId: null  OR  cardId: { isSet: false }
            const unset = o.cardId === undefined;
            return where.OR.some((c) => (c.cardId === null ? o.cardId === null : unset));
          }
          return true;
        });
        matched.forEach((o) => Object.assign(o, data));
        return { count: matched.length };
      }),
    },
    card: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; slug?: string } }) =>
        db.cards.find((c) => (where.id ? c.id === where.id : c.slug === where.slug)) ?? null
      ),
      create: (args: { data: { slug: string; userId: string | null } }) => cardCreate(args),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        db.cards = db.cards.filter((c) => c.id !== where.id);
        return {};
      }),
    },
    paymentLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `log-${db.paymentLogs.length + 1}`, ...data };
        db.paymentLogs.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = db.paymentLogs.find((l) => l.id === where.id)!;
        Object.assign(row, data);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: { where: { razorpayOrderId: string } }) =>
        db.paymentLogs.find((l) => l.razorpayOrderId === where.razorpayOrderId) ?? null
      ),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; status?: { not: string } }; data: Record<string, unknown> }) => {
        const matched = db.paymentLogs.filter((l) => l.id === where.id && (!where.status || l.status !== where.status.not));
        matched.forEach((l) => Object.assign(l, data));
        return { count: matched.length };
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}));

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(async () => ({ collection: () => ({ findOne: async () => null }) })),
}));

const sendEmail = vi.fn(async () => true);
vi.mock('@/lib/email', () => ({ sendEmail: (...args: unknown[]) => sendEmail(...(args as [])) }));
vi.mock('@/lib/emails/send-order-email', () => ({
  sendOrderConfirmationEmail: vi.fn(async () => ({ ok: true })),
  sendOrderStatusEmail: vi.fn(async () => undefined),
}));
vi.mock('@/lib/emails/adminOrderNotification', () => ({
  sendAdminOrderNotification: vi.fn(async () => undefined),
}));

const { generateToken } = await import('@/lib/auth');
const { getPaymentAdapterService } = await import('@/lib/payment-adapter');
const { getRazorpayService } = await import('@/lib/razorpay');
const { POST: createProfile } = await import('../app/api/admin/profiles/route');
const { PATCH: adminPatch } = await import('../app/api/admin/orders/[id]/route');
const { NextRequest } = await import('next/server');

// The only two Razorpay calls that would reach the network.
const razorpay = getRazorpayService();
const createRzpOrder = vi.spyOn(razorpay, 'createOrder');
const getQrPayments = vi.spyOn(razorpay, 'getQrCodePayments');

// ---- helpers ---------------------------------------------------------------------------
const admin = () => generateToken({ userId: ADMIN_ID, email: 'admin@tapvyo.in', role: 'ADMIN' as never });
const customer = () => generateToken({ userId: CUSTOMER_ID, email: USER.email, role: 'CUSTOMER' as never });

function req(method: string, path: string, body: unknown, token?: string) {
  return new NextRequest(`https://tapvyo.in${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { cookie: `auth-token=${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

async function profile(token?: string, orderId = ORDER_ID) {
  const res = await createProfile(req('POST', '/api/admin/profiles', { orderId }, token));
  return { status: res.status, body: await res.json() };
}

async function patch(body: unknown) {
  const res = await adminPatch(req('PATCH', `/api/admin/orders/${ORDER_ID}`, body, admin()));
  return { status: res.status, body: await res.json() };
}

const sign = (rzpOrderId: string, paymentId: string) =>
  crypto.createHmac('sha256', TEST_KEY_SECRET).update(`${rzpOrderId}|${paymentId}`).digest('hex');

/** A payment that has already been started (PaymentLog bound to a Razorpay order). */
function seedStartedPayment(rzpOrderId = 'order_Rzp123', extra: Record<string, unknown> = {}) {
  db.paymentLogs.push({
    id: 'log-started',
    existingOrderId: ORDER_ID,
    razorpayOrderId: rzpOrderId,
    razorpayPaymentId: null,
    razorpayQrCodeId: null,
    amount: 599,
    currency: 'INR',
    status: 'PENDING',
    ...extra,
  });
}

beforeEach(() => {
  db.orders = [makeOrder()];
  db.cards = [];
  db.paymentLogs = [];
  cardSeq = 0;
  cardCreate.mockClear();
  sendEmail.mockClear();
  createRzpOrder.mockReset().mockImplementation(async () => ({
    id: 'order_RzpNew', amount: 59900, currency: 'INR', receipt: 'r', status: 'created',
  }) as never);
  getQrPayments.mockReset();
  delete process.env.ADMIN_2FA_REQUIRED;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

// ---- POST /api/admin/profiles -------------------------------------------------------------------
describe('POST /api/admin/profiles', () => {
  it('CONFIRMED + PAID -> 201: card created, order.cardId set, email sent', async () => {
    db.orders = [makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID' })];
    const r = await profile(admin());
    expect(r.status).toBe(201);
    expect(r.body.profile).toMatchObject({ id: 'card-1' });
    expect(Object.keys(r.body.profile).sort()).toEqual(['id', 'profileUrl', 'slug']);
    expect(cardCreate).toHaveBeenCalledTimes(1);
    expect(order().cardId).toBe('card-1');
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it.each(['PROCESSING', 'SHIPPED', 'DELIVERED'] as OrderStatus[])('%s + PAID -> 201', async (status) => {
    db.orders = [makeOrder({ status, paymentStatus: 'PAID' })];
    expect((await profile(admin())).status).toBe(201);
    expect(db.cards).toHaveLength(1);
  });

  it('an order whose cardId field is missing entirely (older rows) is treated as having no card', async () => {
    const o = makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    delete o.cardId;
    db.orders = [o];
    expect((await profile(admin())).status).toBe(201);
    expect(order().cardId).toBe('card-1');
  });

  it.each([
    ['CONFIRMED', 'PENDING'],
    ['CONFIRMED', 'FAILED'],
    ['CONFIRMED', 'REFUNDED'],
    ['PENDING', 'PAID'],
    ['CANCELLED', 'PAID'],
    ['REFUNDED', 'PAID'],
  ] as [OrderStatus, PayStatus][])('%s + %s -> 409, no card, no cardId write', async (status, paymentStatus) => {
    db.orders = [makeOrder({ status, paymentStatus })];
    const r = await profile(admin());
    expect(r.status).toBe(409);
    expect(r.body.message).toBe('Order is not eligible for profile creation');
    expect(cardCreate).not.toHaveBeenCalled();
    expect(order().cardId).toBeNull();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('missing order -> 404 (unchanged)', async () => {
    const r = await profile(admin(), '507f1f77bcf86cd7994390ff');
    expect(r.status).toBe(404);
    expect(r.body.message).toBe('Order not found');
  });

  it('missing orderId -> 400 (unchanged)', async () => {
    const res = await createProfile(req('POST', '/api/admin/profiles', {}, admin()));
    expect(res.status).toBe(400);
  });

  it('non-admin -> 403 and signed-out -> 401 (unchanged), no card', async () => {
    db.orders = [makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID' })];
    expect((await profile(customer())).status).toBe(403);
    expect((await profile(undefined)).status).toBe(401);
    expect(cardCreate).not.toHaveBeenCalled();
  });

  it('twice on the same order -> 201 then 409 "This order already has a profile"; one card', async () => {
    db.orders = [makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID' })];
    expect((await profile(admin())).status).toBe(201);
    const second = await profile(admin());
    expect(second.status).toBe(409);
    expect(second.body.message).toBe('This order already has a profile');
    expect(db.cards).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('an order already carrying a card from the CONFIRMED auto-create gets 409, not a second card', async () => {
    db.orders = [makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID', cardId: 'card-existing' })];
    const r = await profile(admin());
    expect(r.status).toBe(409);
    expect(cardCreate).not.toHaveBeenCalled();
  });

  it('two concurrent calls: exactly one card survives and is linked', async () => {
    db.orders = [makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID' })];
    const results = await Promise.all([profile(admin()), profile(admin())]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(db.cards).toHaveLength(1);
    expect(order().cardId).toBe(db.cards[0].id);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});

// ---- createPaymentOrder -----------------------------------------------------------------------------
describe('createPaymentOrder', () => {
  const start = () => getPaymentAdapterService().createPaymentOrder({ existingOrderId: ORDER_ID } as never);

  it.each(['CANCELLED', 'REFUNDED'] as OrderStatus[])(
    '%s order -> "This order can no longer be paid"; no PaymentLog, no Razorpay call',
    async (status) => {
      db.orders = [makeOrder({ status, paymentStatus: status === 'REFUNDED' ? 'REFUNDED' : 'PENDING' })];
      await expect(start()).rejects.toThrow('This order can no longer be paid');
      expect(db.paymentLogs).toHaveLength(0);
      expect(createRzpOrder).not.toHaveBeenCalled();
    }
  );

  it.each(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as OrderStatus[])(
    '%s + unpaid order still starts a payment (regression)',
    async (status) => {
      db.orders = [makeOrder({ status })];
      const result = await start();
      expect(result).toMatchObject({ orderId: 'order_RzpNew', amount: 59900, currency: 'INR' });
      expect(createRzpOrder).toHaveBeenCalledTimes(1);
      expect(db.paymentLogs).toHaveLength(1);
      expect(db.paymentLogs[0].razorpayOrderId).toBe('order_RzpNew');
    }
  );

  it('an already PAID order is still refused (regression)', async () => {
    db.orders = [makeOrder({ status: 'CONFIRMED', paymentStatus: 'PAID' })];
    await expect(start()).rejects.toThrow('This order has already been paid');
    expect(createRzpOrder).not.toHaveBeenCalled();
  });
});

// ---- verifyPayment: Option A (always record captured money) -------------------------------------------
describe('verifyPayment', () => {
  const verify = (signature?: string) =>
    getPaymentAdapterService().verifyPayment({
      existingOrderId: ORDER_ID,
      razorpayOrderId: 'order_Rzp123',
      razorpayPaymentId: 'pay_Abc',
      razorpaySignature: signature ?? sign('order_Rzp123', 'pay_Abc'),
    } as never);

  it.each(['PENDING', 'CANCELLED', 'REFUNDED'] as OrderStatus[])(
    '%s order + valid signature -> PAID + paidAt written, status untouched',
    async (status) => {
      db.orders = [makeOrder({ status })];
      seedStartedPayment();
      const r = await verify();
      expect(r.success).toBe(true);
      expect(order()).toMatchObject({ paymentStatus: 'PAID', paymentId: 'pay_Abc', status });
      expect(order().paidAt).toBeInstanceOf(Date);
    }
  );

  it('a bad signature still fails and writes nothing (unchanged)', async () => {
    seedStartedPayment();
    const r = await verify('0'.repeat(64));
    expect(r.success).toBe(false);
    expect(order()).toMatchObject({ paymentStatus: 'PENDING', paidAt: null });
  });

  it('verifying twice leaves one PAID and the first paidAt', async () => {
    seedStartedPayment();
    await verify();
    const firstPaidAt = order().paidAt;
    const again = await verify();
    expect(again).toMatchObject({ success: true, alreadyFulfilled: true });
    expect(order().paidAt).toBe(firstPaidAt);
  });
});

// ---- UPI check: Option A ----------------------------------------------------------------------------------
describe('UPI checkCapturedPayment', () => {
  it('CANCELLED order + captured payment -> PAID + paidAt written, status untouched', async () => {
    db.orders = [makeOrder({ status: 'CANCELLED' })];
    seedStartedPayment('order_RzpQr', { razorpayQrCodeId: 'qr_1' });
    getQrPayments.mockResolvedValue([{ id: 'pay_Upi', status: 'captured', amount: 59900, currency: 'INR' }] as never);
    const r = await getPaymentAdapterService().checkCapturedPayment({
      existingOrderId: ORDER_ID,
      razorpayOrderId: 'order_RzpQr',
      razorpayQrCodeId: 'qr_1',
    });
    expect(r.success).toBe(true);
    expect(order()).toMatchObject({ paymentStatus: 'PAID', paymentMethod: 'razorpay_upi', status: 'CANCELLED' });
    expect(order().paidAt).toBeInstanceOf(Date);
  });
});

// ---- PATCH /api/admin/orders/:id CONFIRMED ------------------------------------------------------------------
describe('admin PATCH CONFIRMED: card only for a paid order', () => {
  it('PAID -> card created and NFC email sent (regression)', async () => {
    db.orders = [makeOrder({ paymentStatus: 'PAID' })];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warn.mockClear();
    const r = await patch({ status: 'CONFIRMED' });
    expect(r.status).toBe(200);
    expect(Object.keys(r.body).sort()).toEqual(['card', 'message', 'order']);
    expect(cardCreate).toHaveBeenCalledTimes(1);
    expect(order()).toMatchObject({ status: 'CONFIRMED', cardId: 'card-1' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(['PENDING', 'FAILED', 'REFUNDED'] as PayStatus[])(
    '%s -> status saved as CONFIRMED, same response, no card, no NFC email, one warning',
    async (paymentStatus) => {
      db.orders = [makeOrder({ paymentStatus })];
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warn.mockClear();
      const r = await patch({ status: 'CONFIRMED' });
      expect(r.status).toBe(200);
      // Same body as any status change without a new card: { message, order }.
      expect(Object.keys(r.body).sort()).toEqual(['message', 'order']);
      expect(r.body.message).toBe('Order updated successfully');
      expect(order().status).toBe('CONFIRMED');
      expect(order().cardId).toBeNull();
      expect(cardCreate).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain('TV-2001');
    }
  );

  it('recording PAID and confirming in the same save still creates the card', async () => {
    db.orders = [makeOrder({ paymentStatus: 'PENDING' })];
    const r = await patch({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect(r.status).toBe(200);
    expect(cardCreate).toHaveBeenCalledTimes(1);
    expect(order()).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID', cardId: 'card-1' });
  });
});
