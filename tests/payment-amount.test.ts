import { describe, expect, it } from 'vitest';
import {
  toPaise,
  InvalidAmountError,
  MAX_ORDER_AMOUNT_INR,
  MIN_ORDER_AMOUNT_INR,
} from '@/lib/payment-amount';

describe('toPaise', () => {
  it('converts whole rupees to integer paise', () => {
    expect(toPaise(499)).toBe(49900);
    expect(toPaise(599)).toBe(59900);
    expect(toPaise(1)).toBe(100);
  });

  it('always returns a safe integer', () => {
    for (const amount of [1, 99.99, 499, 599.5, 1234.56, MAX_ORDER_AMOUNT_INR]) {
      const paise = toPaise(amount);
      expect(Number.isSafeInteger(paise)).toBe(true);
    }
  });

  it('rounds float artefacts instead of passing them through', () => {
    // These are the amounts where naive `amount * 100` produces a non-integer
    // that Razorpay would reject outright.
    expect(8.2 * 100).toBe(819.9999999999999);
    expect(1.1 * 100).toBe(110.00000000000001);

    expect(toPaise(8.2)).toBe(820);
    expect(toPaise(1.1)).toBe(110);
    expect(toPaise(599.99)).toBe(59999);
    expect(toPaise(10.994)).toBe(1099); // sub-paise precision is rounded away
  });

  it('rejects zero and negative amounts', () => {
    expect(() => toPaise(0)).toThrow(InvalidAmountError);
    expect(() => toPaise(-1)).toThrow(InvalidAmountError);
    expect(() => toPaise(-49900)).toThrow(InvalidAmountError);
  });

  it('rejects amounts below the minimum', () => {
    expect(() => toPaise(MIN_ORDER_AMOUNT_INR - 0.01)).toThrow(InvalidAmountError);
    expect(() => toPaise(0.5)).toThrow(InvalidAmountError);
  });

  it('rejects amounts above the sane maximum', () => {
    expect(() => toPaise(MAX_ORDER_AMOUNT_INR + 1)).toThrow(InvalidAmountError);
    expect(() => toPaise(99_999_999)).toThrow(InvalidAmountError);
  });

  it('rejects non-finite numbers', () => {
    expect(() => toPaise(NaN)).toThrow(InvalidAmountError);
    expect(() => toPaise(Infinity)).toThrow(InvalidAmountError);
    expect(() => toPaise(-Infinity)).toThrow(InvalidAmountError);
  });

  it('rejects strings and other non-numbers, including numeric-looking strings', () => {
    expect(() => toPaise('499')).toThrow(InvalidAmountError);
    expect(() => toPaise('499.00')).toThrow(InvalidAmountError);
    expect(() => toPaise(null)).toThrow(InvalidAmountError);
    expect(() => toPaise(undefined)).toThrow(InvalidAmountError);
    expect(() => toPaise({})).toThrow(InvalidAmountError);
    expect(() => toPaise([499])).toThrow(InvalidAmountError);
  });
});
