import crypto from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';

// Throwaway values used only to exercise the HMAC. Real credentials live in
// .env.local and are never checked in.
const TEST_KEY_ID = 'test_key_id_placeholder_not_real';
const TEST_KEY_SECRET = 'unit_test_secret_not_a_real_key';

process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

// Imported after the env is set, because the service reads it on construction.
const { getRazorpayService, timingSafeEqualHex } = await import('@/lib/razorpay');

/** The signature Razorpay would send for this order/payment pair. */
function sign(orderId: string, paymentId: string, secret = TEST_KEY_SECRET) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

const ORDER_ID = 'order_TestOrder123456';
const PAYMENT_ID = 'pay_TestPayment123456';

describe('timingSafeEqualHex', () => {
  it('accepts identical digests', () => {
    const digest = sign(ORDER_ID, PAYMENT_ID);
    expect(timingSafeEqualHex(digest, digest)).toBe(true);
  });

  it('rejects a digest differing in a single character', () => {
    const digest = sign(ORDER_ID, PAYMENT_ID);
    const tampered = (digest[0] === 'a' ? 'b' : 'a') + digest.slice(1);
    expect(timingSafeEqualHex(digest, tampered)).toBe(false);
  });

  it('rejects mismatched lengths without throwing', () => {
    const digest = sign(ORDER_ID, PAYMENT_ID);
    expect(timingSafeEqualHex(digest, digest.slice(0, -2))).toBe(false);
    expect(timingSafeEqualHex(digest, digest + 'ff')).toBe(false);
    expect(timingSafeEqualHex(digest, '')).toBe(false);
  });

  it('rejects non-string input', () => {
    const digest = sign(ORDER_ID, PAYMENT_ID);
    expect(timingSafeEqualHex(digest, undefined as unknown as string)).toBe(false);
    expect(timingSafeEqualHex(digest, null as unknown as string)).toBe(false);
  });
});

describe('RazorpayService.verifyPaymentSignature', () => {
  let service: ReturnType<typeof getRazorpayService>;

  beforeAll(() => {
    service = getRazorpayService();
  });

  it('accepts a signature Razorpay would have produced', () => {
    expect(
      service.verifyPaymentSignature({
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PAYMENT_ID,
        razorpay_signature: sign(ORDER_ID, PAYMENT_ID),
      })
    ).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const valid = sign(ORDER_ID, PAYMENT_ID);
    const tampered = valid.slice(0, -1) + (valid.endsWith('0') ? '1' : '0');

    expect(
      service.verifyPaymentSignature({
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PAYMENT_ID,
        razorpay_signature: tampered,
      })
    ).toBe(false);
  });

  it('rejects a signature signed with the wrong secret', () => {
    expect(
      service.verifyPaymentSignature({
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PAYMENT_ID,
        razorpay_signature: sign(ORDER_ID, PAYMENT_ID, 'a_different_secret'),
      })
    ).toBe(false);
  });

  it('rejects a valid signature replayed against a different payment id', () => {
    // Someone who watched one successful payment cannot reuse its signature.
    expect(
      service.verifyPaymentSignature({
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: 'pay_SomeOtherPayment99',
        razorpay_signature: sign(ORDER_ID, PAYMENT_ID),
      })
    ).toBe(false);
  });

  it('rejects a valid signature replayed against a different order id', () => {
    expect(
      service.verifyPaymentSignature({
        razorpay_order_id: 'order_SomeOtherOrder99',
        razorpay_payment_id: PAYMENT_ID,
        razorpay_signature: sign(ORDER_ID, PAYMENT_ID),
      })
    ).toBe(false);
  });

  it('rejects empty and malformed signatures instead of throwing', () => {
    for (const signature of ['', 'not-hex', 'deadbeef']) {
      expect(
        service.verifyPaymentSignature({
          razorpay_order_id: ORDER_ID,
          razorpay_payment_id: PAYMENT_ID,
          razorpay_signature: signature,
        })
      ).toBe(false);
    }
  });
});
