import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

/**
 * Verifies the guarantees the transactional email layer claims:
 *
 *   1. Two triggers of the same (order, type) send ONE email and leave ONE
 *      email_log row.
 *   2. A provider failure - a bad API key, an outage - never throws out of the
 *      email path. It writes a `failed` row and the caller carries on.
 *   3. An order with no checkout-form recipient address is never mailed, and
 *      never falls back to an account address.
 *   4. A shipped notice with no courier or tracking number fails into
 *      email_log rather than going out half empty.
 *   5. The admin resend takes over a settled row instead of inserting a
 *      second one, so the unique index never has to be dropped.
 *
 * The fake Prisma below models the one thing the whole design rests on: the
 * unique index on (orderId, type), which makes the second insert fail with
 * P2002 rather than succeed.
 */

const db = {
  orders: [] as any[],
  emailLogs: [] as any[],
  cards: [] as any[],
};

function uniqueViolation() {
  return new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the constraint: `orderId_type`',
    { code: 'P2002', clientVersion: 'test' }
  );
}

function matches(row: any, where: any) {
  if (where.orderId !== undefined && row.orderId !== where.orderId) return false;
  if (where.type !== undefined && row.type !== where.type) return false;
  if (where.status?.in && !where.status.in.includes(row.status)) return false;
  if (typeof where.status === 'string' && row.status !== where.status) return false;
  return true;
}

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(async ({ where }: any) =>
        db.orders.find((o) => o.id === where.id) ?? null
      ),
    },
    card: {
      findUnique: vi.fn(async ({ where }: any) =>
        db.cards.find((c) => c.id === where.id) ?? null
      ),
    },
    emailLog: {
      create: vi.fn(async ({ data }: any) => {
        // The unique index, modelled.
        const clash = db.emailLogs.find(
          (row) => row.orderId === data.orderId && row.type === data.type
        );
        if (clash) throw uniqueViolation();

        const row = { id: `log_${db.emailLogs.length + 1}`, providerId: null, error: null, sentAt: null, ...data };
        db.emailLogs.push(row);
        return row;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        const hit = db.emailLogs.filter((row) => matches(row, where));
        hit.forEach((row) => Object.assign(row, data));
        return { count: hit.length };
      }),
      findMany: vi.fn(async ({ where }: any) =>
        db.emailLogs.filter((row) => matches(row, where))
      ),
    },
  },
}));

/** Stands in for Resend. `mode` decides how the provider behaves. */
let mode: 'ok' | 'api-error' | 'throw' = 'ok';
const send = vi.fn(async () => {
  if (mode === 'throw') {
    throw new Error('getaddrinfo ENOTFOUND api.resend.com');
  }
  if (mode === 'api-error') {
    // How the SDK actually reports a bad key: in the payload, not by throwing.
    return { data: null, error: { name: 'validation_error', message: 'API key is invalid' } };
  }
  return { data: { id: 'msg_abc123' }, error: null };
});

vi.mock('@/lib/emails/resend', () => ({
  getResendClient: () => ({ emails: { send } }),
  getEmailFrom: () => 'Tapvyo Orders <orders@tapvyo.com>',
  getEmailReplyTo: () => 'tapvyo@gmail.com',
  // Business copy. Null here so these tests assert the customer path only.
  getEmailBcc: () => null,
}));

const {
  resendOrderEmail,
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderStatusEmail,
} = await import('@/lib/emails/send-order-email');

const ORDER_ID = '507f1f77bcf86cd799439011';

function seed(overrides: Record<string, unknown> = {}) {
  db.orders = [
    {
      id: ORDER_ID,
      orderNumber: 'ORD-ABC123-XY9Z',
      recipientEmail: 'buyer@example.com',
      guestName: 'Jane Doe',
      designation: 'Founder',
      company: 'Acme Pvt Ltd',
      cardType: 'Premium Metal',
      productTier: 'Premium',
      productImageUrl:
        'https://res.cloudinary.com/demo/image/upload/v1/admin/products/metal.jpg',
      guestPhone: '+91 90800 86908',
      cardId: null,
      items: [{ productName: 'Premium Metal', quantity: 2, price: 799, total: 1598 }],
      total: 1598,
      courierName: 'Delhivery',
      trackingNumber: 'DL1234567890',
      trackingUrl: 'https://delhivery.com/track/DL1234567890',
      expectedDeliveryFrom: new Date('2026-09-12T00:00:00Z'),
      expectedDeliveryTo: new Date('2026-09-15T00:00:00Z'),
      ...overrides,
    },
  ];
  db.emailLogs = [];
  db.cards = [{ id: 'card_1', slug: 'jane-doe' }];
  mode = 'ok';
  send.mockClear();
}

const logsFor = (type: string) => db.emailLogs.filter((row) => row.type === type);

describe('transactional order email idempotency', () => {
  beforeEach(() => seed());

  it('sends once and logs one row for a single trigger', async () => {
    const result = await sendOrderConfirmationEmail(ORDER_ID);

    expect(result).toEqual({ ok: true, providerId: 'msg_abc123' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(logsFor('confirmation')).toHaveLength(1);
    expect(logsFor('confirmation')[0]).toMatchObject({
      status: 'sent',
      providerId: 'msg_abc123',
      error: null,
    });
  });

  it('sends only once when the same type is triggered twice', async () => {
    const first = await sendOrderConfirmationEmail(ORDER_ID);
    const second = await sendOrderConfirmationEmail(ORDER_ID);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
    expect(logsFor('confirmation')).toHaveLength(1);
  });

  it('sends only once under concurrent triggers', async () => {
    const results = await Promise.all([
      sendOrderConfirmationEmail(ORDER_ID),
      sendOrderConfirmationEmail(ORDER_ID),
      sendOrderConfirmationEmail(ORDER_ID),
      sendOrderConfirmationEmail(ORDER_ID),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(logsFor('confirmation')).toHaveLength(1);
  });

  it('keeps each email type independent', async () => {
    await sendOrderConfirmationEmail(ORDER_ID);
    await sendOrderShippedEmail(ORDER_ID);

    expect(send).toHaveBeenCalledTimes(2);
    expect(logsFor('confirmation')).toHaveLength(1);
    expect(logsFor('shipped')).toHaveLength(1);
  });
});

describe('transactional order email failure isolation', () => {
  beforeEach(() => seed());

  it('records a failed row and does not throw when the API key is rejected', async () => {
    mode = 'api-error';

    const result = await sendOrderConfirmationEmail(ORDER_ID);

    expect(result.ok).toBe(false);
    expect(logsFor('confirmation')).toHaveLength(1);
    expect(logsFor('confirmation')[0].status).toBe('failed');
    expect(logsFor('confirmation')[0].error).toContain('API key is invalid');
  });

  it('records a failed row and does not throw when the provider is unreachable', async () => {
    mode = 'throw';

    const result = await sendOrderConfirmationEmail(ORDER_ID);

    expect(result.ok).toBe(false);
    expect(logsFor('confirmation')[0].status).toBe('failed');
    expect(logsFor('confirmation')[0].error).toContain('ENOTFOUND');
  });

  it('never falls back to another address when recipientEmail is missing', async () => {
    seed({ recipientEmail: null });

    const result = await sendOrderConfirmationEmail(ORDER_ID);

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(logsFor('confirmation')[0].status).toBe('failed');
    expect(logsFor('confirmation')[0].error).toContain('recipientEmail');
  });

  it('refuses a shipped notice with no courier or tracking number', async () => {
    seed({ courierName: null, trackingNumber: null });

    const result = await sendOrderShippedEmail(ORDER_ID);

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(logsFor('shipped')[0].status).toBe('failed');
    expect(logsFor('shipped')[0].error).toContain('courier name');
    expect(logsFor('shipped')[0].error).toContain('tracking number');
  });
});

describe('admin resend', () => {
  beforeEach(() => seed());

  it('retries a permanently failed send by updating the existing row', async () => {
    mode = 'api-error';
    await sendOrderConfirmationEmail(ORDER_ID);
    expect(logsFor('confirmation')[0].status).toBe('failed');

    mode = 'ok';
    const result = await resendOrderEmail(ORDER_ID, 'confirmation');

    expect(result.ok).toBe(true);
    // One row, not two - the unique index is intact.
    expect(logsFor('confirmation')).toHaveLength(1);
    expect(logsFor('confirmation')[0]).toMatchObject({
      status: 'sent',
      providerId: 'msg_abc123',
      error: null,
    });
  });

  it('re-sends an already sent email on explicit request', async () => {
    await sendOrderConfirmationEmail(ORDER_ID);
    const result = await resendOrderEmail(ORDER_ID, 'confirmation');

    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
    expect(logsFor('confirmation')).toHaveLength(1);
  });

  it('will not steal a send that is still in flight', async () => {
    db.emailLogs.push({
      id: 'log_inflight',
      orderId: ORDER_ID,
      type: 'confirmation',
      status: 'pending',
      providerId: null,
      error: null,
      sentAt: null,
    });

    const result = await resendOrderEmail(ORDER_ID, 'confirmation');

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('status to email mapping', () => {
  beforeEach(() => seed());

  it('sends nothing for statuses that owe the customer no email', async () => {
    expect(await sendOrderStatusEmail(ORDER_ID, 'PENDING')).toBeNull();
    expect(await sendOrderStatusEmail(ORDER_ID, 'CONFIRMED')).toBeNull();
    expect(await sendOrderStatusEmail(ORDER_ID, 'PROCESSING')).toBeNull();
    expect(await sendOrderStatusEmail(ORDER_ID, 'CANCELLED')).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the shipped and delivered notices', async () => {
    expect((await sendOrderStatusEmail(ORDER_ID, 'SHIPPED'))?.ok).toBe(true);
    expect((await sendOrderStatusEmail(ORDER_ID, 'DELIVERED'))?.ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does nothing for an order that does not exist', async () => {
    const result = await sendOrderConfirmationEmail('507f1f77bcf86cd799439099');

    expect(result.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(db.emailLogs).toHaveLength(0);
  });
});
