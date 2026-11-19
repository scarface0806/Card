import { describe, expect, it } from 'vitest';

import { designFeeFor, effectivePrice, orderTotalFor } from '@/lib/products/presentation';

/*
 * The Customised Card charges the card price plus a design fee, both read from
 * the product row. orderTotalFor is what POST /api/orders writes into
 * Order.total, which is the amount Razorpay charges - so these numbers are the
 * money, not just the display.
 */
describe('orderTotalFor', () => {
  it('adds the design fee to the card price for a custom-design product', () => {
    const product = { price: 599, isCustomDesign: true, designFee: 100 };
    expect(designFeeFor(product)).toBe(100);
    expect(orderTotalFor(product)).toBe(699);
  });

  it('leaves a regular product at its own price', () => {
    expect(orderTotalFor({ price: 599 })).toBe(599);
    expect(orderTotalFor({ price: 999, isCustomDesign: null, designFee: null })).toBe(999);
    expect(designFeeFor({ price: 599 })).toBe(0);
  });

  it('ignores a design fee when the product is not a custom design', () => {
    // A stale designFee left on a product that was switched back to regular
    // must not be charged.
    expect(orderTotalFor({ price: 599, isCustomDesign: false, designFee: 100 })).toBe(599);
  });

  it('charges no fee when a custom-design product has none set', () => {
    expect(orderTotalFor({ price: 599, isCustomDesign: true, designFee: null })).toBe(599);
    expect(orderTotalFor({ price: 599, isCustomDesign: true, designFee: -50 })).toBe(599);
  });

  it('discounts the card only - the design fee is fixed during a sale', () => {
    const onSale = { price: 599, salePrice: 499, isCustomDesign: true, designFee: 100 };
    expect(effectivePrice(onSale)).toBe(499);
    expect(orderTotalFor(onSale)).toBe(599);
  });
});
