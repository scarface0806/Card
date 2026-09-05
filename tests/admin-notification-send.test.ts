import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockResendSend = vi.fn();
  const mockGetEmailFrom = vi.fn(() => "Tapvyo <noreply@tricomakes.in>");
  const mockGetEmailReplyTo = vi.fn(() => "tapvyo@gmail.com");
  const mockGetResendClient = vi.fn(() => ({
    emails: {
      send: mockResendSend,
    },
  }));

  return { mockResendSend, mockGetEmailFrom, mockGetEmailReplyTo, mockGetResendClient };
});

import { sendAdminOrderNotification, ADMIN_NOTIFICATION_EMAIL } from '@/lib/emails/adminOrderNotification';

const mockOrder = {
  id: 'ord_123',
  orderNumber: 'ORD-7K2P-QM9X',
  createdAt: new Date('2026-09-04T07:18:11Z'),
  paidAt: new Date('2026-09-04T07:20:33Z'),
  cardType: 'Premium Metal NFC Card',
  productTier: 'Premium',
  price: 7999,
  total: 7999,
  paymentStatus: 'PAID',
  paymentMethod: 'razorpay',
  paymentId: 'pay_R9zK3mQ8nL2vP4',
  guestName: 'Jane Doe',
  guestPhone: '+91 90800 86908',
  guestEmail: 'jane.doe@acme.in',
  recipientEmail: 'jane.doe@acme.in',
  designation: 'Founder & CEO',
  company: 'Acme Pvt Ltd',
  website: 'https://acme.in',
  profileData: {
    personalDetails: {
      name: 'Jane Doe',
      designation: 'Founder & CEO',
      company: 'Acme Pvt Ltd',
      mobile: '+91 90800 86908',
      email: 'jane.doe@acme.in',
    },
    socialLinks: {
      instagram: 'https://instagram.com/janedoe',
      linkedin: 'https://linkedin.com/in/janedoe',
    },
    uploads: {
      profileImage: {},
      logo: {},
    },
    productId: 'prod_123',
    payment: { method: 'card', terms: true },
  },
  cardId: null,
  items: [
    { productId: 'prod_123', productName: 'Premium Metal NFC Card', quantity: 1, price: 7999, total: 7999 },
  ],
};

vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findUnique: vi.fn(async () => mockOrder),
    },
  },
}));

vi.mock('@/lib/site-config', () => ({
  SITE_URL: 'https://tapvyo.com',
  SITE_NAME: 'Tapvyo',
  SUPPORT_EMAIL: 'tapvyo@gmail.com',
}));

vi.mock('@/utils/formatPrice', () => ({
  formatPrice: (amount: number) => `₹${(amount).toLocaleString('en-IN')}`,
}));

vi.mock('@/lib/emails/resend', () => ({
  getResendClient: mocks.mockGetResendClient,
  getEmailFrom: mocks.mockGetEmailFrom,
  getEmailReplyTo: mocks.mockGetEmailReplyTo,
}));

describe('sendAdminOrderNotification', () => {
  beforeEach(() => {
    mocks.mockResendSend.mockReset();
  });

  it('sends to ADMIN_NOTIFICATION_EMAIL with correct envelope', async () => {
    mocks.mockResendSend.mockResolvedValue({
      data: { id: 'msg_abc123' },
      error: null,
    });

    await sendAdminOrderNotification('ord_123', 'pay_R9zK3mQ8nL2vP4');

    expect(mocks.mockResendSend).toHaveBeenCalledTimes(1);

    const call = mocks.mockResendSend.mock.calls[0][0] as Record<string, unknown>;
    expect(call.to).toBe(ADMIN_NOTIFICATION_EMAIL);
    expect(call.to).toBe('tapvyonfc@gmail.com');
    expect(call.from).toBe('Tapvyo <noreply@tricomakes.in>');
    expect(call.replyTo).toBe('tapvyo@gmail.com');
    expect(typeof call.subject).toBe('string');
    expect(call.subject).toContain('Jane Doe');
    expect(call.subject).toContain('Premium Metal NFC Card');
    expect(call.subject).toContain('₹7,999');
    expect(call.subject).toContain('ORD-7K2P-QM9X');
    expect(typeof call.html).toBe('string');
    expect(typeof call.text).toBe('string');
    expect(call.html).not.toContain('undefined');
    expect(call.text).not.toContain('undefined');
  });

  it('never throws on Resend API error', async () => {
    mocks.mockResendSend.mockResolvedValue({
      data: null,
      error: {
        name: 'validation_error',
        message: 'The tapvyo.com domain is not verified.',
        statusCode: 403,
      },
    });

    await expect(sendAdminOrderNotification('ord_123', 'pay_123')).resolves.not.toThrow();
    expect(mocks.mockResendSend).toHaveBeenCalledTimes(1);
  });

  it('never throws on network failure', async () => {
    mocks.mockResendSend.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(sendAdminOrderNotification('ord_123', 'pay_123')).resolves.not.toThrow();
  });

  it('renders missing fields as — not undefined', async () => {
    mocks.mockResendSend.mockResolvedValue({
      data: { id: 'msg_xyz' },
      error: null,
    });

     const orderWithNulls = { ...mockOrder, guestName: null, guestPhone: null, website: null };
    vi.mocked((await import('@/lib/prisma')).default.order.findUnique).mockResolvedValueOnce(orderWithNulls as any);

    await sendAdminOrderNotification('ord_123', null);

    const call = mocks.mockResendSend.mock.calls[0][0] as Record<string, unknown>;
    const html = call.html as string;
    expect(html).not.toContain('undefined');
    expect(html).toContain('—');
  });

  // One order can generate two alerts - one when it is placed, one when payment
  // clears. If both carried the same subject the inbox would be unreadable, so
  // the prefix is the thing that has to stay distinct.
  it('marks an unpaid order in the subject, and leaves a paid one unmarked', async () => {
    const prismaMock = vi.mocked((await import('@/lib/prisma')).default.order.findUnique);

    mocks.mockResendSend.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    // Placed but not yet paid - the alert fired from the order-creation route.
    prismaMock.mockResolvedValueOnce({
      ...mockOrder,
      paymentStatus: 'PENDING',
      paidAt: null,
      paymentId: null,
    } as any);
    await sendAdminOrderNotification('ord_123', null);

    const unpaidSubject = (mocks.mockResendSend.mock.calls[0][0] as Record<string, unknown>)
      .subject as string;
    expect(unpaidSubject).toContain('New order (unpaid)');
    expect(unpaidSubject).toContain('Jane Doe');
    expect(unpaidSubject).toContain('ORD-7K2P-QM9X');

    mocks.mockResendSend.mockClear();

    // Same order after payment clears - the alert fired from payment-adapter.
    prismaMock.mockResolvedValueOnce(mockOrder as any);
    await sendAdminOrderNotification('ord_123', 'pay_R9zK3mQ8nL2vP4');

    const paidSubject = (mocks.mockResendSend.mock.calls[0][0] as Record<string, unknown>)
      .subject as string;
    expect(paidSubject).toContain('New order —');
    expect(paidSubject).not.toContain('unpaid');
  });
});
