import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Throwaway values used only to exercise the HMAC. Real credentials live in
// .env.local and are never checked in.
const TEST_KEY_SECRET = 'unit_test_secret_not_a_real_key';
process.env.RAZORPAY_KEY_ID = 'test_key_id_placeholder_not_real';
process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

/**
 * A tiny in-memory stand-in for the two Prisma models the adapter touches.
 * It models the one behaviour the idempotency guarantee rests on: updateMany
 * applies only to rows matching the `where` filter, and reports how many it hit.
 */
const db = {
  paymentLogs: [] as any[],
  orders: [] as any[],
};

/** Counts real fulfilments, so "same payment_id twice = one fulfilment" is observable. */
let fulfilmentCount = 0;

vi.mock('@/lib/prisma', () => ({
  default: {
    paymentLog: {
      findUnique: vi.fn(async ({ where }: any) =>
        db.paymentLogs.find((l) => l.razorpayOrderId === where.razorpayOrderId) ?? null
      ),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const matched = db.paymentLogs.filter(
          (l) => l.id === where.id && (!where.status?.not || l.status !== where.status.not)
        );
        matched.forEach((l) => Object.assign(l, data));
        return { count: matched.length };
      }),
    },
    order: {
      findUnique: vi.fn(async ({ where }: any) =>
        db.orders.find((o) => o.id === where.id) ?? null
      ),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const matched = db.orders.filter(
          (o) => o.id === where.id && (!where.paymentStatus?.not || o.paymentStatus !== where.paymentStatus.not)
        );
        matched.forEach((o) => {
          Object.assign(o, data);
          fulfilmentCount += 1;
        });
        return { count: matched.length };
      }),
    },
  },
}));

const { getPaymentAdapterService } = await import('@/lib/payment-adapter');

const INTERNAL_ORDER_ID = '507f1f77bcf86cd799439011';
const RZP_ORDER_ID = 'order_TestOrder123456';
const PAYMENT_ID = 'pay_TestPayment123456';

function sign(orderId: string, paymentId: string, secret = TEST_KEY_SECRET) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

function seed() {
  db.paymentLogs = [
    {
      id: 'log_1',
      existingOrderId: INTERNAL_ORDER_ID,
      razorpayOrderId: RZP_ORDER_ID,
      razorpayPaymentId: null,
      razorpaySignature: null,
      amount: 599,
      status: 'PENDING',
    },
  ];
  db.orders = [
    { id: INTERNAL_ORDER_ID, total: 599, paymentStatus: 'PENDING', paymentId: null },
  ];
  fulfilmentCount = 0;
}

const verify = (overrides: Partial<Record<string, string>> = {}) =>
  getPaymentAdapterService().verifyPayment({
    existingOrderId: INTERNAL_ORDER_ID,
    razorpayOrderId: RZP_ORDER_ID,
    razorpayPaymentId: PAYMENT_ID,
    razorpaySignature: sign(RZP_ORDER_ID, PAYMENT_ID),
    ...overrides,
  } as any);

describe('verifyPayment', () => {
  beforeEach(seed);

  it('marks the order paid on a valid signature', async () => {
    const result = await verify();

    expect(result.success).toBe(true);
    expect(result.alreadyFulfilled).toBe(false);
    expect(db.orders[0].paymentStatus).toBe('PAID');
    expect(db.orders[0].paymentId).toBe(PAYMENT_ID);
    expect(db.paymentLogs[0].status).toBe('SUCCESS');
    expect(fulfilmentCount).toBe(1);
  });

  it('does not mark the order paid on a tampered signature', async () => {
    const result = await verify({ razorpaySignature: sign(RZP_ORDER_ID, PAYMENT_ID).replace(/.$/, '0') });

    expect(result.success).toBe(false);
    expect(db.orders[0].paymentStatus).toBe('PENDING');
    expect(db.paymentLogs[0].status).toBe('FAILED');
    expect(fulfilmentCount).toBe(0);
  });

  it('does not mark the order paid when the signature is signed with another secret', async () => {
    const result = await verify({
      razorpaySignature: sign(RZP_ORDER_ID, PAYMENT_ID, 'attacker_secret'),
    });

    expect(result.success).toBe(false);
    expect(db.orders[0].paymentStatus).toBe('PENDING');
    expect(fulfilmentCount).toBe(0);
  });

  it('fulfils only once when the same payment_id is submitted twice', async () => {
    const first = await verify();
    const second = await verify();

    expect(first.success).toBe(true);
    expect(first.alreadyFulfilled).toBe(false);

    // The replay still reports success to the browser - the customer did pay -
    // but no second fulfilment happened.
    expect(second.success).toBe(true);
    expect(second.alreadyFulfilled).toBe(true);
    expect(fulfilmentCount).toBe(1);
  });

  it('stays idempotent across many replays', async () => {
    await Promise.all([verify(), verify(), verify(), verify(), verify()]);
    expect(fulfilmentCount).toBe(1);
    expect(db.orders[0].paymentStatus).toBe('PAID');
  });

  it('rejects a different payment_id against an already-paid order', async () => {
    await verify();

    const other = 'pay_AnotherPayment9999';
    const result = await verify({
      razorpayPaymentId: other,
      razorpaySignature: sign(RZP_ORDER_ID, other),
    });

    expect(result.success).toBe(false);
    expect(db.orders[0].paymentId).toBe(PAYMENT_ID);
    expect(fulfilmentCount).toBe(1);
  });

  it('rejects a razorpay order that we never created', async () => {
    const result = await getPaymentAdapterService().verifyPayment({
      existingOrderId: INTERNAL_ORDER_ID,
      razorpayOrderId: 'order_NeverCreated',
      razorpayPaymentId: PAYMENT_ID,
      razorpaySignature: sign('order_NeverCreated', PAYMENT_ID),
    });

    expect(result.success).toBe(false);
    expect(fulfilmentCount).toBe(0);
  });

  it('rejects a payment log belonging to a different internal order', async () => {
    const result = await getPaymentAdapterService().verifyPayment({
      existingOrderId: '507f1f77bcf86cd799439099',
      razorpayOrderId: RZP_ORDER_ID,
      razorpayPaymentId: PAYMENT_ID,
      razorpaySignature: sign(RZP_ORDER_ID, PAYMENT_ID),
    });

    expect(result.success).toBe(false);
    expect(db.orders[0].paymentStatus).toBe('PENDING');
    expect(fulfilmentCount).toBe(0);
  });
});
