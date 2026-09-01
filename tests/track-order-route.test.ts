import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Route-level behaviour of the public tracking endpoint.
 *
 * The property being tested is that the RESPONSE BODY is identical no matter
 * why a lookup failed - wrong reference, wrong mobile, reference that never
 * existed, or a rate limit. If any of those bodies differ, the endpoint
 * becomes an oracle for whether an order reference exists.
 *
 * The Upstash limiter itself is mocked; whether Upstash counts correctly is
 * its own concern and needs live credentials to observe.
 */

const db = { orders: [] as any[] };

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(async ({ where }: any) =>
        db.orders.find((o) => o.orderNumber === where.orderNumber) ?? null
      ),
    },
  },
}));

class FakeRateLimiterUnavailableError extends Error {
  constructor() {
    super('upstash not configured');
    this.name = 'RateLimiterUnavailableError';
  }
}

/** 'allow' | 'block' | 'unavailable' */
let limiterMode: 'allow' | 'block' | 'unavailable' = 'allow';

vi.mock('@/lib/track-order-rate-limit', () => ({
  RateLimiterUnavailableError: FakeRateLimiterUnavailableError,
  getClientIp: () => '203.0.113.7',
  limitTrackOrderLookup: vi.fn(async () => {
    if (limiterMode === 'unavailable') throw new FakeRateLimiterUnavailableError();
    if (limiterMode === 'block') return { ok: false, retryAfter: 420 };
    return { ok: true };
  }),
}));

const { POST } = await import('../app/api/track-order/route');

function request(body: unknown) {
  return new Request('https://tapvyo.com/api/track-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

beforeEach(() => {
  limiterMode = 'allow';
  db.orders = [
    {
      orderNumber: 'ORD-ABC123-XY9Z',
      status: 'SHIPPED',
      createdAt: new Date('2026-09-01T10:00:00Z'),
      printingAt: new Date('2026-09-02T10:00:00Z'),
      shippedAt: new Date('2026-09-04T10:00:00Z'),
      deliveredAt: null,
      courierName: 'Delhivery',
      trackingNumber: 'DL1234567890',
      trackingUrl: 'https://delhivery.com/track/DL1234567890',
      expectedDeliveryFrom: null,
      expectedDeliveryTo: null,
      guestPhone: '9876543210',
      user: null,
      // Fields that must never reach the response even though the fake row
      // carries them - the projection is what keeps them out.
      address: '12 Secret Lane, Trichy',
      guestEmail: 'buyer@example.com',
      recipientEmail: 'buyer@example.com',
      paymentId: 'pay_Secret123',
      total: 1598,
    },
  ];
});

const GENERIC = "We couldn't find an order matching those details.";

describe('POST /api/track-order', () => {
  it('returns the timeline for a matching reference and mobile', async () => {
    const response = await POST(request({ ref: 'ord-abc123-xy9z', mobile: '+91 98765 43210' }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.order.orderRef).toBe('ORD-ABC123-XY9Z');
    expect(payload.order.stage).toBe('shipped');
  });

  it('leaks no address, payment or email data on success', async () => {
    const response = await POST(request({ ref: 'ORD-ABC123-XY9Z', mobile: '9876543210' }));
    const raw = JSON.stringify(await response.json());

    for (const secret of [
      '12 Secret Lane',
      'buyer@example.com',
      'pay_Secret123',
      '1598',
      '9876543210',
    ]) {
      expect(raw).not.toContain(secret);
    }
  });

  it('gives the same body for a wrong mobile as for a nonexistent reference', async () => {
    const wrongMobile = await POST(request({ ref: 'ORD-ABC123-XY9Z', mobile: '9000000000' }));
    const noSuchRef = await POST(request({ ref: 'ORD-NOPE00-0000', mobile: '9876543210' }));

    const a = await wrongMobile.json();
    const b = await noSuchRef.json();

    expect(a).toEqual({ success: false, message: GENERIC });
    expect(b).toEqual(a);
    expect(wrongMobile.status).toBe(noSuchRef.status);
  });

  it('gives the same message for a malformed body', async () => {
    const response = await POST(request({ ref: '', mobile: '' }));
    const payload = await response.json();

    expect(payload).toEqual({ success: false, message: GENERIC });
  });

  it('gives the same message when rate limited, and sets Retry-After', async () => {
    limiterMode = 'block';

    const response = await POST(request({ ref: 'ORD-ABC123-XY9Z', mobile: '9876543210' }));
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('420');
    // Byte-identical to a miss: a throttled attacker learns nothing about
    // whether their last guess was right.
    expect(payload).toEqual({ success: false, message: GENERIC });
  });

  it('does not touch the database once rate limited', async () => {
    limiterMode = 'block';
    const prisma = (await import('@/lib/prisma')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findUnique = prisma.order.findUnique as any;
    findUnique.mockClear();

    await POST(request({ ref: 'ORD-ABC123-XY9Z', mobile: '9876543210' }));

    expect(findUnique).not.toHaveBeenCalled();
  });

  it('fails closed when the rate limiter is not configured', async () => {
    limiterMode = 'unavailable';

    const response = await POST(request({ ref: 'ORD-ABC123-XY9Z', mobile: '9876543210' }));
    const payload = await response.json();

    // 503, never a free unlimited lookup.
    expect(response.status).toBe(503);
    expect(payload.success).toBe(false);
    expect(payload.message).not.toContain('ORD-ABC123-XY9Z');
  });
});
