import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The public tracking lookup has two jobs it must not get wrong:
 *
 *   1. Never confirm that an order reference exists. A wrong reference, a
 *      correct reference with the wrong mobile, and a reference that never
 *      existed must all be indistinguishable.
 *   2. Never return address, payment or email data - not even in a field the
 *      UI happens not to render, because the network response is visible.
 */

const db = { orders: [] as any[] };

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(async ({ where }: any) => {
        const order = db.orders.find((o) => o.orderNumber === where.orderNumber);
        return order ?? null;
      }),
    },
  },
}));

const {
  TRACKING_SELECT,
  lookupOrderForTracking,
  normalizeMobileLast10,
  normalizeOrderRef,
} = await import('@/lib/track-order');

function seed(overrides: Record<string, unknown> = {}) {
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
      expectedDeliveryFrom: new Date('2026-09-06T00:00:00Z'),
      expectedDeliveryTo: new Date('2026-09-09T00:00:00Z'),
      guestPhone: '+91 98765 43210',
      user: null,
      ...overrides,
    },
  ];
}

describe('normalizeOrderRef', () => {
  it('trims, uppercases and drops copy-paste whitespace', () => {
    expect(normalizeOrderRef('  ord-abc123-xy9z ')).toBe('ORD-ABC123-XY9Z');
    expect(normalizeOrderRef('ORD-ABC123 -XY9Z')).toBe('ORD-ABC123-XY9Z');
  });
});

describe('normalizeMobileLast10', () => {
  it('strips spaces, dashes and country prefixes down to the last 10 digits', () => {
    expect(normalizeMobileLast10('+91 98765 43210')).toBe('9876543210');
    expect(normalizeMobileLast10('98765-43210')).toBe('9876543210');
    expect(normalizeMobileLast10('919876543210')).toBe('9876543210');
    expect(normalizeMobileLast10('0091-98765 43210')).toBe('9876543210');
    expect(normalizeMobileLast10('(098765) 43210')).toBe('9876543210');
  });

  it('returns null when there are not 10 digits to compare', () => {
    expect(normalizeMobileLast10('98765')).toBeNull();
    expect(normalizeMobileLast10('')).toBeNull();
    expect(normalizeMobileLast10('not a number')).toBeNull();
  });
});

describe('lookupOrderForTracking', () => {
  beforeEach(() => seed());

  it('returns the order when the reference and mobile both match', async () => {
    const order = await lookupOrderForTracking(' ord-abc123-xy9z ', '+91 98765 43210');

    expect(order).not.toBeNull();
    expect(order?.orderRef).toBe('ORD-ABC123-XY9Z');
    expect(order?.stage).toBe('shipped');
    expect(order?.cancelled).toBe(false);
    expect(order?.courierName).toBe('Delhivery');
    expect(order?.timestamps.placed).toBe('2026-09-01T10:00:00.000Z');
    expect(order?.timestamps.delivered).toBeNull();
  });

  it('returns null for the right reference with the wrong mobile', async () => {
    expect(await lookupOrderForTracking('ORD-ABC123-XY9Z', '9000000000')).toBeNull();
  });

  it('returns null for a reference that does not exist', async () => {
    expect(await lookupOrderForTracking('ORD-NOPE00-0000', '9876543210')).toBeNull();
  });

  it('gives the same answer for a wrong mobile as for a nonexistent reference', async () => {
    const wrongMobile = await lookupOrderForTracking('ORD-ABC123-XY9Z', '9000000000');
    const noSuchRef = await lookupOrderForTracking('ORD-NOPE00-0000', '9876543210');

    // Both null, so the route has nothing to differentiate on.
    expect(wrongMobile).toEqual(noSuchRef);
  });

  it('returns null when either input is unusable', async () => {
    expect(await lookupOrderForTracking('', '9876543210')).toBeNull();
    expect(await lookupOrderForTracking('ORD-ABC123-XY9Z', '123')).toBeNull();
  });

  it('accepts the account phone recorded against the same order', async () => {
    seed({ guestPhone: null, user: { phone: '9876543210' } });

    const order = await lookupOrderForTracking('ORD-ABC123-XY9Z', '9876543210');
    expect(order).not.toBeNull();
  });

  it('flags a cancelled order instead of pretending it is in progress', async () => {
    seed({ status: 'CANCELLED' });

    const order = await lookupOrderForTracking('ORD-ABC123-XY9Z', '9876543210');
    expect(order?.cancelled).toBe(true);
    expect(order?.stage).toBe('placed');
  });

  it('maps every status to a stage', async () => {
    const cases: [string, string][] = [
      ['PENDING', 'placed'],
      ['CONFIRMED', 'placed'],
      ['PROCESSING', 'printing'],
      ['SHIPPED', 'shipped'],
      ['DELIVERED', 'delivered'],
    ];

    for (const [status, stage] of cases) {
      seed({ status });
      const order = await lookupOrderForTracking('ORD-ABC123-XY9Z', '9876543210');
      expect(order?.stage).toBe(stage);
    }
  });

  it('never returns address, payment, email or profile data', async () => {
    const order = await lookupOrderForTracking('ORD-ABC123-XY9Z', '9876543210');
    const serialized = JSON.stringify(order);

    for (const forbidden of [
      'address',
      'shippingAddress',
      'billingAddress',
      'paymentId',
      'paymentStatus',
      'paymentMethod',
      'total',
      'price',
      'guestEmail',
      'recipientEmail',
      'guestPhone',
      'profileData',
      'userId',
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it('selects no sensitive column in the first place', () => {
    // The projection is the real guard. Filtering after the fact would still
    // put the whole row on the wire.
    const selected = Object.keys(TRACKING_SELECT);

    for (const forbidden of [
      'address',
      'shippingAddress',
      'billingAddress',
      'paymentId',
      'paymentStatus',
      'paymentMethod',
      'total',
      'subtotal',
      'price',
      'guestEmail',
      'recipientEmail',
      'profileData',
      'notes',
    ]) {
      expect(selected).not.toContain(forbidden);
    }
  });
});
