import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Step 10 - webhook vs. verify vs. UPI poll: the order is fulfilled (PAID,
 * paidAt, confirmation + admin emails) exactly once, whichever arrives first.
 *
 * Real: the webhook route, PaymentAdapterService (verifyPayment, the UPI
 * check, fulfilPayment), RazorpayService's checkout AND webhook HMAC checks
 * (throwaway test secrets), toPaise.
 * Stubbed: Prisma (in-memory; updateMany yields before its check-and-write so
 * parallel calls really interleave), the two email senders (spies), and the
 * one Razorpay network call the UPI check makes.
 *
 * Fixture contact details are placeholders, never real customer data.
 */

const KEY_SECRET = 'unit_test_secret_not_a_real_key';
const WEBHOOK_SECRET = 'unit_test_webhook_secret_not_real';
process.env.RAZORPAY_KEY_ID = 'test_key_id_placeholder_not_real';
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

const ORDER_ID = '507f1f77bcf86cd799439011';
const RZP_ORDER = 'order_RaceTest0001';
const QR_ID = 'qr_RaceTest0001';
const PAY_ID = 'pay_RaceTest0001';
const REDACTED_EMAIL = 'redacted@example.invalid';
const REDACTED_PHONE = '+910000000000';

type Log = {
  id: string;
  existingOrderId: string;
  razorpayOrderId: string;
  razorpayQrCodeId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: number;
  currency: string;
  status: string;
  metadata: unknown;
};
type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentId: string | null;
  paidAt: Date | null;
};

const db = { logs: [] as Log[], orders: [] as Order[] };
let orderWrites = 0;
let failNextLogLookup = false;

const tick = () => new Promise((r) => setTimeout(r, 2));

vi.mock('@/lib/prisma', () => ({
  default: {
    paymentLog: {
      findUnique: vi.fn(async ({ where }: { where: { razorpayOrderId: string } }) => {
        if (failNextLogLookup) {
          failNextLogLookup = false;
          throw new Error('simulated database outage');
        }
        const l = db.logs.find((x) => x.razorpayOrderId === where.razorpayOrderId);
        return l ? structuredClone(l) : null;
      }),
      findFirst: vi.fn(async ({ where }: { where: { razorpayQrCodeId: string } }) => {
        const l = db.logs.find((x) => x.razorpayQrCodeId === where.razorpayQrCodeId);
        return l ? structuredClone(l) : null;
      }),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; status?: { not: string } }; data: Partial<Log> }) => {
        await tick();
        const matched = db.logs.filter((l) => l.id === where.id && (!where.status || l.status !== where.status.not));
        matched.forEach((l) => Object.assign(l, data));
        return { count: matched.length };
      }),
    },
    order: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const o = db.orders.find((x) => x.id === where.id);
        return o ? structuredClone(o) : null;
      }),
      updateMany: vi.fn(async ({ where, data }: { where: { id: string; paymentStatus?: { not: string } }; data: Partial<Order> }) => {
        await tick();
        const matched = db.orders.filter(
          (o) => o.id === where.id && (!where.paymentStatus || o.paymentStatus !== where.paymentStatus.not)
        );
        matched.forEach((o) => {
          Object.assign(o, data);
          orderWrites += 1;
        });
        return { count: matched.length };
      }),
    },
  },
}));

const customerEmail = vi.fn(async (_orderId: string) => ({ ok: true as const }));
const adminEmail = vi.fn(async (_orderId: string, _paymentId?: string) => undefined);
vi.mock('@/lib/emails/send-order-email', () => ({
  sendOrderConfirmationEmail: (id: string) => customerEmail(id),
}));
vi.mock('@/lib/emails/adminOrderNotification', () => ({
  sendAdminOrderNotification: (id: string, pay?: string) => adminEmail(id, pay),
}));

const { getPaymentAdapterService } = await import('@/lib/payment-adapter');
const { getRazorpayService } = await import('@/lib/razorpay');
const { POST: webhook } = await import('../app/api/payment/webhook/route');
const { NextRequest } = await import('next/server');

const qrPayments = vi.spyOn(getRazorpayService(), 'getQrCodePayments');
const adapter = () => getPaymentAdapterService();

// ---- builders ------------------------------------------------------------------------------
function seed(overrides: { order?: Partial<Order>; log?: Partial<Log> } = {}) {
  db.logs = [{
    id: 'log_1',
    existingOrderId: ORDER_ID,
    razorpayOrderId: RZP_ORDER,
    razorpayQrCodeId: QR_ID,
    razorpayPaymentId: null,
    razorpaySignature: null,
    amount: 599,
    currency: 'INR',
    status: 'PENDING',
    metadata: null,
    ...overrides.log,
  }];
  db.orders = [{
    id: ORDER_ID,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: null,
    paymentId: null,
    paidAt: null,
    ...overrides.order,
  }];
}

/** A Razorpay payment entity, as in the docs (amount in paise). */
const paymentEntity = (extra: Record<string, unknown> = {}) => ({
  id: PAY_ID,
  entity: 'payment',
  amount: 59900,
  currency: 'INR',
  status: 'captured',
  order_id: RZP_ORDER,
  method: 'card',
  email: REDACTED_EMAIL,
  contact: REDACTED_PHONE,
  notes: [],
  fee: 1180,
  ...extra,
});

function eventBody(event: string, payload: Record<string, unknown>) {
  return { entity: 'event', account_id: 'acc_test', event, contains: Object.keys(payload), payload, created_at: 1700000000 };
}

const wrap = (entity: Record<string, unknown>) => ({ entity });

async function sendWebhook(body: unknown, signature?: string) {
  const raw = JSON.stringify(body);
  const sig = signature ?? crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  const res = await webhook(new NextRequest('https://tapvyo.in/api/payment/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': sig },
    body: raw,
  }));
  return { status: res.status, body: await res.json() };
}

const captured = (extra?: Record<string, unknown>) =>
  eventBody('payment.captured', { payment: wrap(paymentEntity(extra)) });

const verify = (paymentId = PAY_ID) =>
  adapter().verifyPayment({
    existingOrderId: ORDER_ID,
    razorpayOrderId: RZP_ORDER,
    razorpayPaymentId: paymentId,
    razorpaySignature: crypto.createHmac('sha256', KEY_SECRET).update(`${RZP_ORDER}|${paymentId}`).digest('hex'),
  });

const upiPoll = () =>
  adapter().checkCapturedPayment({ existingOrderId: ORDER_ID, razorpayOrderId: RZP_ORDER, razorpayQrCodeId: QR_ID });

const order = () => db.orders[0];
const log = () => db.logs[0];

function expectFulfilledOnce() {
  expect(order().paymentStatus).toBe('PAID');
  expect(order().paidAt).toBeInstanceOf(Date);
  expect(orderWrites).toBe(1);
  expect(customerEmail).toHaveBeenCalledTimes(1);
  expect(adminEmail).toHaveBeenCalledTimes(1);
}

let logLines: string[];
/** The route's own per-event line. (razorpayDebugger also logs in non-production.) */
const webhookLines = () => logLines.filter((line) => line.startsWith('[webhook]'));

beforeEach(() => {
  seed();
  orderWrites = 0;
  failNextLogLookup = false;
  customerEmail.mockClear();
  adminEmail.mockClear();
  qrPayments.mockReset();
  logLines = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    logLines.push(args.map(String).join(' '));
  });
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ---- the races -----------------------------------------------------------------------------------
describe('whichever path arrives first, the order is fulfilled exactly once', () => {
  it('payment.captured webhook first, verify second', async () => {
    expect((await sendWebhook(captured())).status).toBe(200);
    expect(order().paymentStatus).toBe('PAID');
    const paidAt = order().paidAt;

    const r = await verify();
    expect(r).toMatchObject({ success: true, message: 'Payment already verified', alreadyFulfilled: true });
    expectFulfilledOnce();
    expect(order().paidAt).toBe(paidAt);
  });

  it('verify first, payment.captured webhook second', async () => {
    const r = await verify();
    expect(r).toMatchObject({ success: true, message: 'Payment verified successfully', alreadyFulfilled: false });
    expect((await sendWebhook(captured())).status).toBe(200);
    expectFulfilledOnce();
    expect(log().status).toBe('SUCCESS');
  });

  it('order.paid webhook first, verify second: verify succeeds (not "already been paid")', async () => {
    const body = eventBody('order.paid', {
      payment: wrap(paymentEntity()),
      order: wrap({ id: RZP_ORDER, entity: 'order', amount: 59900, amount_paid: 59900, currency: 'INR', status: 'paid', notes: [] }),
    });
    expect((await sendWebhook(body)).status).toBe(200);
    expect(log()).toMatchObject({ status: 'SUCCESS', razorpayPaymentId: PAY_ID });

    const r = await verify();
    expect(r.success).toBe(true);
    expect(r.message).toBe('Payment already verified');
    expectFulfilledOnce();
  });

  it('webhook and verify at the same moment', async () => {
    const [w, r] = await Promise.all([sendWebhook(captured()), verify()]);
    expect(w.status).toBe(200);
    expect(r.success).toBe(true);
    expectFulfilledOnce();
  });

  it('UPI poll first, webhook second', async () => {
    qrPayments.mockResolvedValue([{ id: PAY_ID, status: 'captured', amount: 59900, currency: 'INR' }] as never);
    const r = await upiPoll();
    expect(r).toMatchObject({ success: true, message: 'Payment confirmed' });

    const body = eventBody('qr_code.credited', {
      payment: wrap(paymentEntity({ order_id: null, method: 'upi' })),
      qr_code: wrap({ id: QR_ID, entity: 'qr_code', payments_amount_received: 59900 }),
    });
    expect((await sendWebhook(body)).status).toBe(200);
    expectFulfilledOnce();
    expect(order().paymentMethod).toBe('razorpay_upi');
  });

  it('qr_code.credited webhook first, UPI poll second', async () => {
    const body = eventBody('qr_code.credited', {
      payment: wrap(paymentEntity({ order_id: null, method: 'upi' })),
      qr_code: wrap({ id: QR_ID, entity: 'qr_code' }),
    });
    expect((await sendWebhook(body)).status).toBe(200);
    expect(order()).toMatchObject({ paymentStatus: 'PAID', paymentMethod: 'razorpay_upi' });

    const r = await upiPoll();
    expect(r).toMatchObject({ success: true, message: 'Payment confirmed' });
    expectFulfilledOnce();
    expect(qrPayments).not.toHaveBeenCalled();
  });

  it('two webhook deliveries (Razorpay retry): one paidAt, one set of emails', async () => {
    await sendWebhook(captured());
    const paidAt = order().paidAt;
    expect((await sendWebhook(captured())).status).toBe(200);
    expectFulfilledOnce();
    expect(order().paidAt).toBe(paidAt);
  });

  it('verify twice: one set of emails', async () => {
    await verify();
    await verify();
    expectFulfilledOnce();
  });

  it('a verify that crashed after its claim is completed by the next path', async () => {
    // Log already SUCCESS (claim won) but the order write never happened.
    seed({ log: { status: 'SUCCESS', razorpayPaymentId: PAY_ID } });
    expect((await sendWebhook(captured())).status).toBe(200);
    expectFulfilledOnce();
  });
});

// ---- webhook edge cases ------------------------------------------------------------------------------
describe('webhook edge cases', () => {
  it('unknown payment log -> 200, nothing written; a later verify still fulfils', async () => {
    // The log is still under its placeholder key (not yet bound to the Razorpay order).
    seed({ log: { razorpayOrderId: 'pending_placeholder' } });
    const w = await sendWebhook(captured());
    expect(w.status).toBe(200);
    expect(order().paymentStatus).toBe('PENDING');
    expect(customerEmail).not.toHaveBeenCalled();

    log().razorpayOrderId = RZP_ORDER;
    expect((await verify()).success).toBe(true);
    expectFulfilledOnce();
  });

  it('the OLD payload shape (no .entity wrapper) does not fulfil', async () => {
    const old = { event: 'payment.captured', payload: { payment: paymentEntity({ notes: { orderId: ORDER_ID } }) } };
    const w = await sendWebhook(old);
    expect(w.status).toBe(200);
    expect(log().status).toBe('PENDING');
    expect(order().paymentStatus).toBe('PENDING');
    expect(customerEmail).not.toHaveBeenCalled();
  });

  it('payment.captured with the wrong amount -> 200, no claim, no fulfilment, logged', async () => {
    const w = await sendWebhook(captured({ amount: 100 }));
    expect(w.status).toBe(200);
    expect(log().status).toBe('PENDING');
    expect(order().paymentStatus).toBe('PENDING');
    expect(adminEmail).not.toHaveBeenCalled();
    const lines = webhookLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('mismatch');
  });

  it('qr_code.credited with the wrong amount or currency -> same', async () => {
    for (const extra of [{ amount: 100 }, { currency: 'USD' }]) {
      const body = eventBody('qr_code.credited', {
        payment: wrap(paymentEntity({ order_id: null, ...extra })),
        qr_code: wrap({ id: QR_ID, entity: 'qr_code' }),
      });
      expect((await sendWebhook(body)).status).toBe(200);
    }
    expect(log().status).toBe('PENDING');
    expect(order().paymentStatus).toBe('PENDING');
    expect(customerEmail).not.toHaveBeenCalled();
  });

  it('payment.failed after a SUCCESS leaves the log SUCCESS', async () => {
    await verify();
    const failed = eventBody('payment.failed', {
      payment: wrap(paymentEntity({ id: 'pay_OtherAttempt', status: 'failed', error_code: 'BAD_REQUEST_ERROR' })),
    });
    expect((await sendWebhook(failed)).status).toBe(200);
    expect(log()).toMatchObject({ status: 'SUCCESS', razorpayPaymentId: PAY_ID });
  });

  it('payment.failed on a pending payment still marks it FAILED', async () => {
    const failed = eventBody('payment.failed', { payment: wrap(paymentEntity({ status: 'failed' })) });
    await sendWebhook(failed);
    expect(log().status).toBe('FAILED');
    expect(order().paymentStatus).toBe('PENDING');
  });

  it('payment.authorized records metadata only: no SUCCESS, no order write', async () => {
    const authorized = eventBody('payment.authorized', { payment: wrap(paymentEntity({ status: 'authorized' })) });
    expect((await sendWebhook(authorized)).status).toBe(200);
    expect(log().status).toBe('PENDING');
    expect(log().razorpayPaymentId).toBeNull();
    expect(log().metadata).toMatchObject({ webhookEvent: 'payment.authorized' });
    expect(orderWrites).toBe(0);
    expect(customerEmail).not.toHaveBeenCalled();
  });

  it('an internal error -> 500 (Razorpay retries); the retry then fulfils', async () => {
    failNextLogLookup = true;
    const w = await sendWebhook(captured());
    expect(w.status).toBe(500);
    expect(JSON.stringify(w.body)).not.toContain('simulated');
    expect(order().paymentStatus).toBe('PENDING');

    expect((await sendWebhook(captured())).status).toBe(200);
    expectFulfilledOnce();
  });

  it('a bad signature -> 403 (unchanged), nothing fulfilled', async () => {
    const w = await sendWebhook(captured(), '0'.repeat(64));
    expect(w.status).toBe(403);
    expect(log().status).toBe('PENDING');
    expect(orderWrites).toBe(0);
  });

  it('an unhandled event -> 200, nothing written', async () => {
    const w = await sendWebhook(eventBody('refund.created', { refund: wrap({ id: 'rfnd_1' }) }));
    expect(w.status).toBe(200);
    expect(orderWrites).toBe(0);
  });

  it('logs exactly one line per event, with the order id and no PII or payment id', async () => {
    await sendWebhook(captured());
    const lines = webhookLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('payment.captured');
    expect(lines[0]).toContain(ORDER_ID);
    // Nothing logged during the request - the route's line or the existing
    // dev-only razorpayDebugger line - carries PII or the payment id.
    for (const line of logLines) {
      for (const secret of [REDACTED_EMAIL, REDACTED_PHONE, PAY_ID]) {
        expect(line).not.toContain(secret);
      }
    }
    // Stored metadata no longer copies the customer's email or phone either.
    expect(JSON.stringify(log().metadata)).not.toMatch(/redacted@|\+910000000000/);
  });
});

// ---- cancelled / refunded orders --------------------------------------------------------------------
describe('a payment on a cancelled or refunded order', () => {
  it.each(['CANCELLED', 'REFUNDED'])(
    '%s: PAID + paidAt recorded, admin alert sent, customer email skipped',
    async (status) => {
      seed({ order: { status } });
      expect((await sendWebhook(captured())).status).toBe(200);
      expect(order()).toMatchObject({ status, paymentStatus: 'PAID' });
      expect(order().paidAt).toBeInstanceOf(Date);
      expect(adminEmail).toHaveBeenCalledTimes(1);
      expect(customerEmail).not.toHaveBeenCalled();
    }
  );

  it('no-op fulfilment logs one "already fulfilled" info line with the order id only', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    info.mockClear();
    await verify();
    await sendWebhook(captured());
    expect(info).toHaveBeenCalledTimes(1);
    expect(String(info.mock.calls[0][0])).toContain(ORDER_ID);
    expect(String(info.mock.calls[0][0])).not.toContain(PAY_ID);
  });
});
